# CodeFlow AI Platform - API Documentation

## Overview

The CodeFlow AI Platform API is a RESTful API that provides AI-powered competitive programming learning features. The API is built on AWS serverless architecture using Lambda functions, API Gateway, and Amazon Bedrock for GenAI capabilities.

**Base URL:** `https://api.codeflow.ai/v1`

**Region:** ap-south-1 (Mumbai)

**Team:**
- Lahar Joshi (Team Leader)
- Kushagra Pratap Rajput
- Harshita Devanani

## Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Error Handling](#error-handling)
4. [API Endpoints](#api-endpoints)
   - [Authentication Endpoints](#authentication-endpoints)
   - [Profile Analysis Endpoints](#profile-analysis-endpoints)
   - [Chat Mentor Endpoints](#chat-mentor-endpoints)
   - [Recommendation Endpoints](#recommendation-endpoints)
   - [Progress Tracking Endpoints](#progress-tracking-endpoints)
   - [Admin Analytics Endpoints](#admin-analytics-endpoints)
5. [Code Examples](#code-examples)
6. [Viewing with Swagger UI](#viewing-with-swagger-ui)

---

## Authentication

Most API endpoints require JWT (JSON Web Token) authentication. Include the access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Token Lifecycle

- **Access Token:** Valid for 24 hours
- **Refresh Token:** Valid for 30 days
- Use `/auth/refresh` to get a new access token without re-authenticating

### Example Authentication Flow

```bash
# 1. Register
curl -X POST https://api.codeflow.ai/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "leetcode_username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "language_preference": "en"
  }'

# Response:
# {
#   "user_id": "550e8400-e29b-41d4-a716-446655440000",
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "expires_in": 86400
# }

# 2. Use access token for authenticated requests
curl -X GET https://api.codeflow.ai/v1/progress/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Refresh token when expired
curl -X POST https://api.codeflow.ai/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

---

## Rate Limiting

The API implements rate limiting to ensure fair usage:

| User Type | Rate Limit | Burst Limit |
|-----------|------------|-------------|
| Authenticated User | 100 requests/minute | 200 requests |
| Anonymous (IP-based) | 10 requests/minute | 20 requests |
| Admin | 1000 requests/minute | 2000 requests |

### Rate Limit Headers

Response headers include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### Rate Limit Exceeded Response

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again in 60 seconds.",
  "retry_after": 60
}
```

---

## Error Handling

The API uses standard HTTP status codes and returns error details in JSON format.

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 202 | Accepted - Request accepted for async processing |
| 400 | Bad Request - Invalid input parameters |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |

### Error Response Format

```json
{
  "error": "Invalid request",
  "details": {
    "field": "leetcode_username",
    "message": "Field required"
  }
}
```

### Common Error Examples

**Invalid Authentication:**
```json
{
  "error": "Invalid credentials"
}
```

**Missing Required Field:**
```json
{
  "error": "Invalid request",
  "details": [
    {
      "loc": ["body", "user_id"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Resource Not Found:**
```json
{
  "error": "User not found"
}
```

---

## API Endpoints

### Authentication Endpoints

#### POST /auth/register

Register a new user account.

**Request:**
```json
{
  "leetcode_username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "language_preference": "en"
}
```

**Response (201 Created):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400
}
```

**Errors:**
- `400` - Invalid input (weak password, invalid email)
- `409` - User already exists

---

#### POST /auth/login

Authenticate user and receive JWT tokens.

**Request:**
```json
{
  "leetcode_username": "john_doe",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "leetcode_username": "john_doe",
    "language_preference": "en"
  }
}
```

**Errors:**
- `401` - Invalid credentials

---

#### POST /auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400
}
```

**Errors:**
- `401` - Invalid or expired refresh token

---

### Profile Analysis Endpoints

#### POST /analyze/profile

Analyze LeetCode profile and calculate topic proficiency.

**Authentication:** Required

**Request:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "leetcode_username": "john_doe",
  "submissions": []
}
```

**Response (200 OK):**
```json
{
  "message": "Profile analysis complete",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "topics": {
    "dynamic-programming": {
      "proficiency": 35.5,
      "classification": "weak"
    },
    "arrays": {
      "proficiency": 78.2,
      "classification": "strong"
    },
    "graphs": {
      "proficiency": 52.0,
      "classification": "moderate"
    }
  },
  "heatmap": {
    "weak": [
      {"name": "dynamic-programming", "proficiency": 35.5},
      {"name": "backtracking", "proficiency": 28.0}
    ],
    "moderate": [
      {"name": "graphs", "proficiency": 52.0},
      {"name": "trees", "proficiency": 61.5}
    ],
    "strong": [
      {"name": "arrays", "proficiency": 78.2},
      {"name": "strings", "proficiency": 82.0}
    ]
  },
  "summary": {
    "total_topics": 15,
    "weak_topics": 4,
    "moderate_topics": 6,
    "strong_topics": 5
  }
}
```

**Topic Classification:**
- **Weak:** Proficiency < 40%
- **Moderate:** Proficiency 40-70%
- **Strong:** Proficiency > 70%

**Proficiency Calculation:**
```
proficiency = (problems_solved / problems_attempted) × 100
```

**Errors:**
- `400` - Missing required fields
- `404` - Profile not found (sync with LeetCode first)

---

#### GET /analyze/{user_id}/topics

Get detailed topic proficiency breakdown.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "topics": {
    "dynamic-programming": {
      "proficiency": 35.5,
      "classification": "weak"
    },
    "arrays": {
      "proficiency": 78.2,
      "classification": "strong"
    }
  }
}
```

---

### Chat Mentor Endpoints

#### POST /chat-mentor

Chat with AI mentor for help with coding problems, concepts, or debugging.

**Authentication:** Required

**Features:**
- Multi-step reasoning with Amazon Bedrock Claude
- RAG (Retrieval-Augmented Generation) for accurate answers
- Intent detection (code debugging, concept questions, hints)
- LLM caching for 80% cost savings

**Request:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Why is my DP solution getting TLE?",
  "code": "def solve(n):\n    if n <= 1:\n        return n\n    return solve(n-1) + solve(n-2)",
  "problem_id": "fibonacci-number"
}
```

**Response (200 OK):**
```json
{
  "response": "Your solution is getting Time Limit Exceeded because you're using plain recursion without memoization. Each call to solve(n) recalculates solve(n-1) and solve(n-2), leading to exponential time complexity O(2^n).\n\nHere's what's happening:\n- solve(5) calls solve(4) and solve(3)\n- solve(4) calls solve(3) and solve(2)\n- Notice solve(3) is calculated twice!\n\nTo fix this, add memoization using a dictionary to cache results. This reduces time complexity to O(n).",
  "intent": "CODE_DEBUGGING",
  "cached": false,
  "model_used": "sonnet"
}
```

**Intent Types:**
- `CODE_DEBUGGING` - User has code issue (uses Claude Sonnet)
- `CONCEPT_QUESTION` - Asking about algorithm/concept (uses Claude Haiku)
- `HINT_REQUEST` - Wants a hint (uses Claude Haiku)
- `GENERAL` - General question (uses Claude Haiku)

**Model Selection (Budget Optimization):**
- **Claude Haiku:** Simple queries (10x cheaper)
- **Claude Sonnet:** Complex code analysis

**Errors:**
- `400` - Missing required fields

---

### Recommendation Endpoints

#### POST /recommendations/generate-path

Generate personalized learning path using Amazon Bedrock.

**Authentication:** Required

**Request:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "weak_topics": ["dynamic-programming", "graphs"],
  "strong_topics": ["arrays", "strings"],
  "proficiency_level": "intermediate"
}
```

**Response (200 OK):**
```json
{
  "path_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "problems": [
    {
      "title": "Climbing Stairs",
      "difficulty": "Easy",
      "topics": ["dynamic-programming"],
      "leetcode_id": "70",
      "estimated_time_minutes": 15,
      "reason": "Foundation for DP - simple state transition"
    },
    {
      "title": "House Robber",
      "difficulty": "Medium",
      "topics": ["dynamic-programming"],
      "leetcode_id": "198",
      "estimated_time_minutes": 25,
      "reason": "Builds on previous DP concepts"
    }
  ],
  "total_problems": 25,
  "weak_topics_targeted": ["dynamic-programming", "graphs"],
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Learning Path Requirements:**
- 20-30 problems total
- 70%+ problems target weak topics
- Difficulty distribution: 30% Easy, 50% Medium, 20% Hard
- Logical progression from easier to harder concepts

**Errors:**
- `400` - Missing user_id

---

#### GET /recommendations/next-problem

Get next recommended problem using Goldilocks algorithm.

**Authentication:** Required

**Query Parameters:**
- `user_id` (required): User ID

**Response (200 OK):**
```json
{
  "problem": {
    "title": "Coin Change",
    "difficulty": "Medium",
    "topics": ["dynamic-programming"],
    "leetcode_id": "322",
    "estimated_time_minutes": 30,
    "reason": "Classic DP problem with optimal substructure"
  },
  "reason": "Increasing difficulty (success rate: 85%)",
  "current_index": 5,
  "total_problems": 25
}
```

**Goldilocks Algorithm:**

The algorithm adapts difficulty based on recent performance:

1. **Calculate success rate** from last 10 problems
2. **Adjust difficulty:**
   - Success ≥80% → Increase difficulty
   - Success ≤40% → Decrease difficulty
   - Otherwise → Maintain current difficulty
3. **Handle consecutive failures:**
   - 2+ consecutive failures → Force easier problem

**Example Scenarios:**

| Success Rate | Action | Reason |
|--------------|--------|--------|
| 85% | Increase difficulty | User is performing well |
| 35% | Decrease difficulty | User is struggling |
| 60% | Maintain difficulty | Balanced performance |
| N/A (2 failures) | Force easier | Prevent frustration |

**Errors:**
- `400` - Missing user_id
- `404` - No learning path found (generate one first)

---

#### POST /recommendations/hint

Generate progressive hint for a problem.

**Authentication:** Required

**Request:**
```json
{
  "problem_id": "two-sum",
  "problem_description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "hint_level": 1
}
```

**Response (200 OK):**
```json
{
  "hint": "Think about what data structure would help you efficiently look up values. What if you could check in constant time whether the complement of the current number exists?",
  "hint_level": 1,
  "problem_id": "two-sum"
}
```

**Hint Levels:**

| Level | Description | Example |
|-------|-------------|---------|
| 1 | High-level approach/key insight | "Think about using a hash map" |
| 2 | Data structure suggestion | "Use a dictionary to store complements" |
| 3 | Algorithm outline (no code) | "Iterate once, checking if target-num exists" |

**Constraints:**
- ✅ Code-free hints (no code snippets)
- ✅ No explicit solutions
- ✅ Conceptual guidance only

**Errors:**
- `400` - Missing required fields or invalid hint_level

---

### Progress Tracking Endpoints

#### GET /progress/{user_id}

Get user progress including streak, badges, and problems solved.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "streak_count": 7,
  "badges": [
    {
      "badge_id": "7-day-streak",
      "name": "7 Day Streak",
      "earned_at": "2024-01-15T10:00:00Z",
      "milestone": 7
    }
  ],
  "problems_solved_today": 3,
  "total_problems_solved": 127,
  "last_solve_timestamp": "2024-01-15T09:30:00Z",
  "next_milestone": {
    "days": 30,
    "badge_name": "30 Day Streak",
    "days_remaining": 23
  }
}
```

**Streak Logic:**
- Increments on daily solve
- Resets if >24 hours pass without solving
- Automatic reset check on GET request

**Badge Milestones:**
- 7 days
- 30 days
- 100 days

**Errors:**
- `400` - Missing user_id
- `404` - User not found

---

### Admin Analytics Endpoints

#### GET /admin/analytics/dau

Get Daily/Weekly/Monthly Active Users metrics.

**Authentication:** Admin API Key required (X-Api-Key header)

**Response (200 OK):**
```json
{
  "date": "2024-01-15",
  "dau": 150,
  "wau": 450,
  "mau": 1200,
  "api_metrics": {
    "avg_response_time_ms": 245,
    "error_rate": 0.02
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Metrics:**
- **DAU:** Unique users active in last 24 hours
- **WAU:** Unique users active in last 7 days
- **MAU:** Unique users active in last 30 days

**Errors:**
- `403` - Forbidden (missing or invalid API key)

---

#### GET /admin/analytics/retention

Get user retention metrics.

**Authentication:** Admin API Key required (X-Api-Key header)

**Response (200 OK):**
```json
{
  "date": "2024-01-15",
  "day1_retention": 0.65,
  "day7_retention": 0.42,
  "day30_retention": 0.28,
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Retention Metrics:**
- **Day 1:** % of users who return the next day
- **Day 7:** % of users who return after 7 days
- **Day 30:** % of users who return after 30 days

**Errors:**
- `403` - Forbidden (missing or invalid API key)

---

## Code Examples

### Python Example

```python
import requests
import json

BASE_URL = "https://api.codeflow.ai/v1"

# 1. Register
response = requests.post(
    f"{BASE_URL}/auth/register",
    json={
        "leetcode_username": "john_doe",
        "email": "john@example.com",
        "password": "SecurePass123!",
        "language_preference": "en"
    }
)
data = response.json()
access_token = data["access_token"]
user_id = data["user_id"]

# 2. Analyze profile
headers = {"Authorization": f"Bearer {access_token}"}
response = requests.post(
    f"{BASE_URL}/analyze/profile",
    headers=headers,
    json={
        "user_id": user_id,
        "leetcode_username": "john_doe"
    }
)
analysis = response.json()
print(f"Weak topics: {analysis['summary']['weak_topics']}")

# 3. Generate learning path
weak_topics = [
    topic for topic, data in analysis['topics'].items()
    if data['classification'] == 'weak'
]
response = requests.post(
    f"{BASE_URL}/recommendations/generate-path",
    headers=headers,
    json={
        "user_id": user_id,
        "weak_topics": weak_topics,
        "proficiency_level": "intermediate"
    }
)
path = response.json()
print(f"Generated path with {path['total_problems']} problems")

# 4. Get next problem
response = requests.get(
    f"{BASE_URL}/recommendations/next-problem",
    headers=headers,
    params={"user_id": user_id}
)
next_problem = response.json()
print(f"Next problem: {next_problem['problem']['title']}")

# 5. Chat with mentor
response = requests.post(
    f"{BASE_URL}/chat-mentor",
    headers=headers,
    json={
        "user_id": user_id,
        "message": "How do I approach dynamic programming problems?",
    }
)
mentor_response = response.json()
print(f"Mentor: {mentor_response['response']}")
```

### JavaScript Example

```javascript
const BASE_URL = "https://api.codeflow.ai/v1";

// 1. Register
const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    leetcode_username: "john_doe",
    email: "john@example.com",
    password: "SecurePass123!",
    language_preference: "en"
  })
});
const { access_token, user_id } = await registerResponse.json();

// 2. Analyze profile
const analysisResponse = await fetch(`${BASE_URL}/analyze/profile`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${access_token}`
  },
  body: JSON.stringify({
    user_id,
    leetcode_username: "john_doe"
  })
});
const analysis = await analysisResponse.json();

// 3. Get progress
const progressResponse = await fetch(`${BASE_URL}/progress/${user_id}`, {
  headers: { "Authorization": `Bearer ${access_token}` }
});
const progress = await progressResponse.json();
console.log(`Current streak: ${progress.streak_count} days`);
```

### cURL Examples

```bash
# Register
curl -X POST https://api.codeflow.ai/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "leetcode_username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "language_preference": "en"
  }'

# Login
curl -X POST https://api.codeflow.ai/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "leetcode_username": "john_doe",
    "password": "SecurePass123!"
  }'

# Analyze profile (with auth)
curl -X POST https://api.codeflow.ai/v1/analyze/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "leetcode_username": "john_doe"
  }'

# Get next problem
curl -X GET "https://api.codeflow.ai/v1/recommendations/next-problem?user_id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Chat with mentor
curl -X POST https://api.codeflow.ai/v1/chat-mentor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "How do I optimize my solution?",
    "code": "def solve(n):\n    return n * 2"
  }'

# Get progress
curl -X GET https://api.codeflow.ai/v1/progress/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Admin: Get DAU (requires admin API key)
curl -X GET https://api.codeflow.ai/v1/admin/analytics/dau \
  -H "X-Api-Key: YOUR_ADMIN_API_KEY"
```

---

## Viewing with Swagger UI

You can view and interact with the API using Swagger UI:

### Option 1: Online Swagger Editor

1. Go to https://editor.swagger.io/
2. Copy the contents of `API-SPECIFICATION.yaml`
3. Paste into the editor
4. Explore endpoints and try them out

### Option 2: Local Swagger UI

```bash
# Install swagger-ui-watcher
npm install -g swagger-ui-watcher

# Run Swagger UI
swagger-ui-watcher infrastructure/docs/API-SPECIFICATION.yaml

# Open browser to http://localhost:8000
```

### Option 3: Docker

```bash
# Run Swagger UI in Docker
docker run -p 8080:8080 \
  -e SWAGGER_JSON=/api/API-SPECIFICATION.yaml \
  -v $(pwd)/infrastructure/docs:/api \
  swaggerapi/swagger-ui

# Open browser to http://localhost:8080
```

---

## Additional Resources

- **OpenAPI Specification:** `infrastructure/docs/API-SPECIFICATION.yaml`
- **Architecture Diagrams:** `infrastructure/docs/ARCHITECTURE-DIAGRAMS.md`
- **Deployment Guide:** `DEPLOYMENT-GUIDE.md`
- **Monitoring Guide:** `infrastructure/docs/MONITORING-ACCESS.md`

---

## Support

For questions or issues:
- Email: team@codeflow.ai
- GitHub Issues: https://github.com/codeflow-ai/platform/issues

---

**Last Updated:** January 2024

**API Version:** 1.0.0
