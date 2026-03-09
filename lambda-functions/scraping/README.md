# LeetCode Scraping Service

This Lambda function handles scraping LeetCode user profiles and submission history with robust retry logic and rate limiting.

## Features

### 1. GraphQL API Integration
- Fetches user profile data including:
  - Total problems solved (by difficulty)
  - Topic proficiency (advanced, intermediate, fundamental)
  - User ranking and reputation
  - Recent submission history

### 2. Exponential Backoff Retry Logic
- Implements retry with exponential backoff: **1s, 2s, 4s**
- Handles rate limiting (429) and server errors (5xx)
- Automatic retry on timeout exceptions
- No retry on client errors (4xx)

### 3. Rate Limit Compliance
- Maximum **10 requests per minute** to LeetCode
- Tracks request timestamps in-memory
- Automatically waits when rate limit is reached
- Cleans up old timestamps (>60 seconds)

### 4. Data Caching
- Caches profile data in DynamoDB Users table
- Stores submissions in S3 for historical analysis
- Includes timestamp for cache invalidation

## API Endpoints

### POST /scraping/fetch-profile
Fetch LeetCode user profile with retry logic.

**Request Body:**
```json
{
  "leetcode_username": "string",
  "user_id": "string"
}
```

**Response:**
```json
{
  "message": "Profile fetched successfully",
  "user_id": "string",
  "leetcode_username": "string",
  "profile": {
    "username": "string",
    "ranking": 12345,
    "total_solved": 150,
    "easy_solved": 50,
    "medium_solved": 75,
    "hard_solved": 25,
    "topics": [
      {
        "name": "Dynamic Programming",
        "slug": "dynamic-programming",
        "problems_solved": 30,
        "level": "advanced"
      }
    ],
    "fetched_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST /scraping/fetch-submissions
Fetch user submission history.

**Request Body:**
```json
{
  "leetcode_username": "string",
  "user_id": "string",
  "limit": 100
}
```

**Response:**
```json
{
  "message": "Submissions fetched successfully",
  "user_id": "string",
  "submissions_count": 100,
  "submissions": [
    {
      "title": "Two Sum",
      "title_slug": "two-sum",
      "timestamp": "1234567890",
      "status": "Accepted",
      "language": "python3",
      "runtime": "50 ms",
      "memory": "14.5 MB"
    }
  ]
}
```

### GET /scraping/status
Get scraping status for a user.

**Query Parameters:**
- `user_id`: User ID

**Response:**
```json
{
  "user_id": "string",
  "status": "idle",
  "last_sync": "2024-01-01T00:00:00Z"
}
```

## Implementation Details

### Retry Logic
```python
RETRY_DELAYS = [1, 2, 4]  # Exponential backoff in seconds

for attempt, delay in enumerate(RETRY_DELAYS):
    try:
        # Make request
        response = await client.post(...)
        
        if response.status_code == 429:
            # Rate limit - retry with backoff
            await asyncio.sleep(delay)
            continue
            
        if response.status_code >= 500:
            # Server error - retry with backoff
            await asyncio.sleep(delay)
            continue
            
        # Success - parse and return
        return parse_response(response)
        
    except TimeoutException:
        # Timeout - retry with backoff
        await asyncio.sleep(delay)
```

### Rate Limiting
```python
MAX_REQUESTS_PER_MINUTE = 10
request_timestamps = []

async def enforce_rate_limit():
    current_time = time.time()
    
    # Remove timestamps older than 60 seconds
    request_timestamps = [ts for ts in request_timestamps if current_time - ts < 60]
    
    # Wait if at limit
    if len(request_timestamps) >= MAX_REQUESTS_PER_MINUTE:
        oldest_timestamp = min(request_timestamps)
        wait_time = 60 - (current_time - oldest_timestamp)
        await asyncio.sleep(wait_time)
```

## Dependencies

- `httpx>=0.25.0` - Async HTTP client
- `boto3` - AWS SDK (from shared layer)
- `aws-xray-sdk` - Distributed tracing (from shared layer)

## Environment Variables

- `USERS_TABLE` - DynamoDB table name for users
- `DATASETS_BUCKET` - S3 bucket for storing submissions
- `ENVIRONMENT` - Environment (dev/staging/prod)

## Testing

Run unit tests:
```bash
cd lambda-functions/scraping
python3 -m pytest test_scraping.py -v -k "not trio"
```

Tests cover:
- Profile data parsing
- Submission data parsing
- Rate limiting logic
- Exponential backoff configuration
- DynamoDB caching
- Error handling

## Error Handling

- **429 Rate Limit**: Retries with exponential backoff
- **5xx Server Errors**: Retries with exponential backoff
- **4xx Client Errors**: No retry, returns error immediately
- **Timeout**: Retries with exponential backoff
- **Network Errors**: Retries with exponential backoff
- **Max Retries Exceeded**: Returns error after 3 attempts

## Performance

- **Typical Response Time**: 1-3 seconds
- **With Retries**: Up to 7 seconds (1s + 2s + 4s)
- **Rate Limit Wait**: Up to 60 seconds if limit reached
- **Memory Usage**: 512MB-1024MB recommended
- **Timeout**: 30 seconds recommended

## Monitoring

The service is instrumented with AWS X-Ray for distributed tracing:
- Request/response tracking
- Retry attempts
- Rate limit enforcement
- DynamoDB operations
- S3 operations

CloudWatch metrics:
- Request count
- Error rate
- Retry count
- Rate limit hits
- Response time (P50, P95, P99)
