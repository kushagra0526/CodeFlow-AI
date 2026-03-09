"""
Scraping Lambda Function
Handles LeetCode scraping: fetch user profiles, submissions, with retry logic and rate limiting
"""

import json
import os
import time
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
import boto3

try:
    import httpx
except ImportError:
    # httpx should be in Lambda layer
    httpx = None

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

users_table = dynamodb.Table(os.environ['USERS_TABLE'])
datasets_bucket = os.environ.get('DATASETS_BUCKET', '')

ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')

# Rate limiting configuration
MAX_REQUESTS_PER_MINUTE = 10
RETRY_DELAYS = [1, 2, 4]  # Exponential backoff in seconds (1s, 2s, 4s)
LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"

# Rate limiter state (in-memory for single Lambda execution)
request_timestamps: List[float] = []
def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for scraping endpoints
    
    Supported operations:
    - POST /scraping/fetch-profile: Fetch LeetCode profile
    - POST /scraping/fetch-submissions: Fetch user submissions
    - GET /scraping/status: Get scraping status
    """
    
    try:
        http_method = event.get('httpMethod', '')
        path = event.get('path', '')
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
        query_parameters = event.get('queryStringParameters', {}) or {}
        
        # Route to appropriate handler
        if http_method == 'POST' and '/fetch-profile' in path:
            # Run async function in event loop
            return asyncio.run(handle_fetch_profile(body))
        elif http_method == 'POST' and '/fetch-submissions' in path:
            return asyncio.run(handle_fetch_submissions(body))
        elif http_method == 'GET' and '/status' in path:
            user_id = query_parameters.get('user_id')
            return handle_get_status(user_id)
        else:
            return {
                'statusCode': 404,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': 'Not found'})
            }
    
    except Exception as e:
        print(f"Error in scraping handler: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Internal server error', 'details': str(e)})
        }
async def handle_fetch_profile(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetch LeetCode profile with retry logic
    
    Expected body:
    {
        "leetcode_username": "string",
        "user_id": "string"
    }
    """
    
    leetcode_username = body.get('leetcode_username')
    user_id = body.get('user_id')
    
    if not leetcode_username or not user_id:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Missing required fields'})
        }
    
    try:
        # Fetch profile data with retry logic
        profile_data = await fetch_leetcode_profile_with_retry(leetcode_username)
        
        # Cache profile data in DynamoDB
        cache_profile_data(user_id, leetcode_username, profile_data)
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'message': 'Profile fetched successfully',
                'user_id': user_id,
                'leetcode_username': leetcode_username,
                'profile': profile_data
            })
        }
    except Exception as e:
        print(f"Error fetching profile: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': f'Failed to fetch profile: {str(e)}'})
        }
async def handle_fetch_submissions(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetch user submissions from LeetCode
    
    Expected body:
    {
        "leetcode_username": "string",
        "user_id": "string",
        "limit": 100 (optional)
    }
    """
    
    leetcode_username = body.get('leetcode_username')
    user_id = body.get('user_id')
    limit = body.get('limit', 100)
    
    if not leetcode_username or not user_id:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Missing required fields'})
        }
    
    try:
        # Fetch submissions with retry logic
        submissions = await fetch_leetcode_submissions_with_retry(leetcode_username, limit)
        
        # Store submissions in S3 if bucket is configured
        if datasets_bucket:
            store_submissions_in_s3(user_id, submissions)
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'message': 'Submissions fetched successfully',
                'user_id': user_id,
                'submissions_count': len(submissions),
                'submissions': submissions
            })
        }
    except Exception as e:
        print(f"Error fetching submissions: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': f'Failed to fetch submissions: {str(e)}'})
        }
async def fetch_leetcode_profile_with_retry(leetcode_username: str) -> Dict[str, Any]:
    """
    Fetch LeetCode profile data with exponential backoff retry logic
    
    Implements:
    - Exponential backoff: 1s, 2s, 4s
    - Rate limit compliance (max 10 req/min)
    - Error handling for 429 (rate limit) and 5xx errors
    """
    
    if httpx is None:
        raise ImportError("httpx is not available. Ensure it's in the Lambda layer.")
    
    # GraphQL query for user profile
    query = """
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
          userAvatar
          realName
          aboutMe
          reputation
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        tagProblemCounts {
          advanced {
            tagName
            tagSlug
            problemsSolved
          }
          intermediate {
            tagName
            tagSlug
            problemsSolved
          }
          fundamental {
            tagName
            tagSlug
            problemsSolved
          }
        }
      }
    }
    """
    
    last_exception = None
    
    for attempt, delay in enumerate(RETRY_DELAYS):
        try:
            # Check rate limit before making request
            await enforce_rate_limit()
            
            # Make GraphQL request
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    LEETCODE_GRAPHQL_URL,
                    json={"query": query, "variables": {"username": leetcode_username}},
                    headers={
                        "Content-Type": "application/json",
                        "User-Agent": "CodeFlow-AI-Platform/1.0"
                    }
                )
                
                # Track request timestamp for rate limiting
                request_timestamps.append(time.time())
                
                # Handle rate limiting
                if response.status_code == 429:
                    print(f"Rate limit hit on attempt {attempt + 1}")
                    if attempt < len(RETRY_DELAYS) - 1:
                        print(f"Retrying in {delay} seconds...")
                        await asyncio.sleep(delay)
                        continue
                    else:
                        raise Exception("Rate limit exceeded after all retries")
                
                # Handle server errors with retry
                if response.status_code >= 500:
                    print(f"Server error {response.status_code} on attempt {attempt + 1}")
                    if attempt < len(RETRY_DELAYS) - 1:
                        print(f"Retrying in {delay} seconds...")
                        await asyncio.sleep(delay)
                        continue
                    else:
                        raise Exception(f"Server error {response.status_code} after all retries")
                
                # Handle client errors (no retry)
                if response.status_code >= 400:
                    raise Exception(f"Client error {response.status_code}: {response.text}")
                
                # Parse response
                data = response.json()
                
                if 'errors' in data:
                    raise Exception(f"GraphQL errors: {data['errors']}")
                
                # Parse and return profile data
                return parse_leetcode_profile(data)
        
        except httpx.TimeoutException as e:
            print(f"Timeout on attempt {attempt + 1}: {str(e)}")
            last_exception = e
            if attempt < len(RETRY_DELAYS) - 1:
                print(f"Retrying in {delay} seconds...")
                await asyncio.sleep(delay)
            else:
                raise Exception("Request timeout after all retries")
        
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {str(e)}")
            last_exception = e
            if attempt < len(RETRY_DELAYS) - 1:
                print(f"Retrying in {delay} seconds...")
                await asyncio.sleep(delay)
            else:
                raise
    
    # Should not reach here, but just in case
    if last_exception:
        raise last_exception
    raise Exception("Failed to fetch profile after all retries")
async def fetch_leetcode_submissions_with_retry(leetcode_username: str, limit: int = 100) -> List[Dict[str, Any]]:
    """
    Fetch LeetCode submission history with retry logic
    """
    
    if httpx is None:
        raise ImportError("httpx is not available. Ensure it's in the Lambda layer.")
    
    # GraphQL query for submissions
    query = """
    query getRecentSubmissions($username: String!, $limit: Int!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        recentSubmissionList(limit: $limit) {
          title
          titleSlug
          timestamp
          statusDisplay
          lang
          runtime
          memory
        }
      }
    }
    """
    
    last_exception = None
    
    for attempt, delay in enumerate(RETRY_DELAYS):
        try:
            # Check rate limit before making request
            await enforce_rate_limit()
            
            # Make GraphQL request
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    LEETCODE_GRAPHQL_URL,
                    json={"query": query, "variables": {"username": leetcode_username, "limit": limit}},
                    headers={
                        "Content-Type": "application/json",
                        "User-Agent": "CodeFlow-AI-Platform/1.0"
                    }
                )
                
                # Track request timestamp for rate limiting
                request_timestamps.append(time.time())
                
                # Handle rate limiting
                if response.status_code == 429:
                    print(f"Rate limit hit on attempt {attempt + 1}")
                    if attempt < len(RETRY_DELAYS) - 1:
                        print(f"Retrying in {delay} seconds...")
                        await asyncio.sleep(delay)
                        continue
                    else:
                        raise Exception("Rate limit exceeded after all retries")
                
                # Handle server errors with retry
                if response.status_code >= 500:
                    print(f"Server error {response.status_code} on attempt {attempt + 1}")
                    if attempt < len(RETRY_DELAYS) - 1:
                        print(f"Retrying in {delay} seconds...")
                        await asyncio.sleep(delay)
                        continue
                    else:
                        raise Exception(f"Server error {response.status_code} after all retries")
                
                # Handle client errors (no retry)
                if response.status_code >= 400:
                    raise Exception(f"Client error {response.status_code}: {response.text}")
                
                # Parse response
                data = response.json()
                
                if 'errors' in data:
                    raise Exception(f"GraphQL errors: {data['errors']}")
                
                # Parse and return submissions
                return parse_leetcode_submissions(data)
        
        except httpx.TimeoutException as e:
            print(f"Timeout on attempt {attempt + 1}: {str(e)}")
            last_exception = e
            if attempt < len(RETRY_DELAYS) - 1:
                print(f"Retrying in {delay} seconds...")
                await asyncio.sleep(delay)
            else:
                raise Exception("Request timeout after all retries")
        
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {str(e)}")
            last_exception = e
            if attempt < len(RETRY_DELAYS) - 1:
                print(f"Retrying in {delay} seconds...")
                await asyncio.sleep(delay)
            else:
                raise
    
    # Should not reach here, but just in case
    if last_exception:
        raise last_exception
    raise Exception("Failed to fetch submissions after all retries")


async def enforce_rate_limit():
    """
    Enforce rate limit of max 10 requests per minute
    Removes timestamps older than 60 seconds and waits if limit is reached
    """
    global request_timestamps
    
    current_time = time.time()
    
    # Remove timestamps older than 60 seconds
    request_timestamps = [ts for ts in request_timestamps if current_time - ts < 60]
    
    # If we've hit the limit, wait until we can make another request
    if len(request_timestamps) >= MAX_REQUESTS_PER_MINUTE:
        oldest_timestamp = min(request_timestamps)
        wait_time = 60 - (current_time - oldest_timestamp)
        
        if wait_time > 0:
            print(f"Rate limit reached. Waiting {wait_time:.2f} seconds...")
            await asyncio.sleep(wait_time)
            
            # Clean up again after waiting
            current_time = time.time()
            request_timestamps = [ts for ts in request_timestamps if current_time - ts < 60]


def parse_leetcode_profile(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse LeetCode GraphQL response into structured profile data
    """
    matched_user = data.get('data', {}).get('matchedUser')
    
    if not matched_user:
        raise Exception("User not found or invalid response")
    
    # Parse submission stats
    submit_stats = matched_user.get('submitStats', {}).get('acSubmissionNum', [])
    stats_by_difficulty = {item['difficulty']: item for item in submit_stats}
    
    # Parse topic proficiency
    tag_counts = matched_user.get('tagProblemCounts', {})
    topics = []
    
    for level in ['advanced', 'intermediate', 'fundamental']:
        level_tags = tag_counts.get(level, [])
        for tag in level_tags:
            if tag.get('problemsSolved', 0) > 0:
                topics.append({
                    'name': tag.get('tagName'),
                    'slug': tag.get('tagSlug'),
                    'problems_solved': tag.get('problemsSolved'),
                    'level': level
                })
    
    # Build profile data
    profile = matched_user.get('profile', {})
    
    return {
        'username': matched_user.get('username'),
        'ranking': profile.get('ranking'),
        'reputation': profile.get('reputation'),
        'total_solved': stats_by_difficulty.get('All', {}).get('count', 0),
        'easy_solved': stats_by_difficulty.get('Easy', {}).get('count', 0),
        'medium_solved': stats_by_difficulty.get('Medium', {}).get('count', 0),
        'hard_solved': stats_by_difficulty.get('Hard', {}).get('count', 0),
        'topics': topics,
        'fetched_at': datetime.now(timezone.utc).isoformat()
    }


def parse_leetcode_submissions(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Parse LeetCode submissions from GraphQL response
    """
    matched_user = data.get('data', {}).get('matchedUser')
    
    if not matched_user:
        raise Exception("User not found or invalid response")
    
    submissions_list = matched_user.get('recentSubmissionList', [])
    
    submissions = []
    for sub in submissions_list:
        submissions.append({
            'title': sub.get('title'),
            'title_slug': sub.get('titleSlug'),
            'timestamp': sub.get('timestamp'),
            'status': sub.get('statusDisplay'),
            'language': sub.get('lang'),
            'runtime': sub.get('runtime'),
            'memory': sub.get('memory')
        })
    
    return submissions


def cache_profile_data(user_id: str, leetcode_username: str, profile_data: Dict[str, Any]):
    """
    Cache profile data in DynamoDB Users table
    """
    try:
        users_table.update_item(
            Key={'user_id': user_id},
            UpdateExpression='SET leetcode_profile = :profile, last_sync = :timestamp',
            ExpressionAttributeValues={
                ':profile': profile_data,
                ':timestamp': datetime.now(timezone.utc).isoformat()
            }
        )
        print(f"Cached profile data for user {user_id}")
    except Exception as e:
        print(f"Error caching profile data: {str(e)}")
        # Don't fail the request if caching fails


def store_submissions_in_s3(user_id: str, submissions: List[Dict[str, Any]]):
    """
    Store submissions data in S3 for historical analysis
    """
    try:
        timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
        key = f"submissions/{user_id}/{timestamp}.json"
        
        s3_client.put_object(
            Bucket=datasets_bucket,
            Key=key,
            Body=json.dumps(submissions, indent=2),
            ContentType='application/json'
        )
        print(f"Stored submissions in S3: {key}")
    except Exception as e:
        print(f"Error storing submissions in S3: {str(e)}")
        # Don't fail the request if S3 storage fails
def handle_get_status(user_id: str) -> Dict[str, Any]:
    """Get scraping status for a user"""
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Missing user_id'})
        }
    
    # TODO: Fetch status from DynamoDB
    
    return {
        'statusCode': 200,
        'headers': get_cors_headers(),
        'body': json.dumps({
            'user_id': user_id,
            'status': 'idle',
            'last_sync': None
        })
    }


def get_cors_headers() -> Dict[str, str]:
    """Return CORS headers for API responses"""
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Request-ID',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }
