# CodeFlow AI Platform - API Documentation

## 📚 Documentation Files

This directory contains comprehensive API documentation for the CodeFlow AI Platform.

### Available Documentation

1. **[API-SPECIFICATION.yaml](./API-SPECIFICATION.yaml)** - OpenAPI 3.0 specification
   - Machine-readable API definition
   - Complete endpoint schemas
   - Request/response examples
   - Authentication and error handling

2. **[API-DOCUMENTATION.md](./API-DOCUMENTATION.md)** - Human-readable API guide
   - Detailed endpoint descriptions
   - Authentication flow
   - Rate limiting information
   - Error handling guide
   - Code examples (Python, JavaScript, cURL)

3. **[API-QUICKSTART.md](./API-QUICKSTART.md)** - Quick start guide
   - Get started in 5 minutes
   - Common use cases
   - Quick reference commands

---

## 🚀 Quick Start

### View API Documentation

#### Option 1: Read Markdown Files

Simply open the markdown files in your editor or GitHub:
- [API-DOCUMENTATION.md](./API-DOCUMENTATION.md) - Full documentation
- [API-QUICKSTART.md](./API-QUICKSTART.md) - Quick start guide

#### Option 2: Swagger UI (Interactive)

**Online (Easiest):**
1. Go to https://editor.swagger.io/
2. Copy contents of `API-SPECIFICATION.yaml`
3. Paste into the editor
4. Explore and test endpoints interactively

**Local with npm:**
```bash
# Install swagger-ui-watcher
npm install -g swagger-ui-watcher

# Run from project root
swagger-ui-watcher infrastructure/docs/API-SPECIFICATION.yaml

# Open http://localhost:8000 in browser
```

**Local with Docker:**
```bash
# Run from project root
docker run -p 8080:8080 \
  -e SWAGGER_JSON=/api/API-SPECIFICATION.yaml \
  -v $(pwd)/infrastructure/docs:/api \
  swaggerapi/swagger-ui

# Open http://localhost:8080 in browser
```

#### Option 3: Redoc (Alternative UI)

```bash
# Install redoc-cli
npm install -g redoc-cli

# Generate static HTML
redoc-cli bundle infrastructure/docs/API-SPECIFICATION.yaml \
  -o infrastructure/docs/api-docs.html

# Open api-docs.html in browser
```

---

## 📖 API Overview

### Base URL
```
Production: https://api.codeflow.ai/v1
Staging: https://staging-api.codeflow.ai/v1
```

### Authentication
Most endpoints require JWT authentication:
```bash
Authorization: Bearer <access_token>
```

### Rate Limits
- Authenticated: 100 requests/minute
- Anonymous: 10 requests/minute

---

## 🔑 API Endpoints Summary

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token

### Profile Analysis
- `POST /analyze/profile` - Analyze LeetCode profile
- `GET /analyze/{user_id}/topics` - Get topic proficiency

### Chat Mentor (AI-Powered)
- `POST /chat-mentor` - Chat with AI mentor
- Uses Amazon Bedrock Claude with RAG

### Recommendations (AI-Powered)
- `POST /recommendations/generate-path` - Generate learning path
- `GET /recommendations/next-problem` - Get next problem (Goldilocks algorithm)
- `POST /recommendations/hint` - Generate hint

### Progress Tracking
- `GET /progress/{user_id}` - Get progress, streaks, badges

### Admin Analytics
- `GET /admin/analytics/dau` - DAU/WAU/MAU metrics
- `GET /admin/analytics/retention` - Retention metrics

---

## 💡 Quick Example

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

# 2. Use the access_token from response
export TOKEN="your_access_token"
export USER_ID="your_user_id"

# 3. Analyze profile
curl -X POST https://api.codeflow.ai/v1/analyze/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"$USER_ID\", \"leetcode_username\": \"john_doe\"}"

# 4. Generate learning path
curl -X POST https://api.codeflow.ai/v1/recommendations/generate-path \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"$USER_ID\", \"weak_topics\": [\"dynamic-programming\"]}"

# 5. Get next problem
curl -X GET "https://api.codeflow.ai/v1/recommendations/next-problem?user_id=$USER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎯 Key Features

### 1. AI-Powered Learning Paths
- Uses Amazon Bedrock Claude 3 Sonnet
- Personalized based on weak/strong topics
- 20-30 problems with optimal difficulty distribution

### 2. Goldilocks Algorithm
- Adaptive difficulty adjustment
- Based on recent success rate
- Prevents frustration and boredom

### 3. Conversational AI Mentor
- Multi-step reasoning with RAG
- Code debugging assistance
- Concept explanations
- 80% cache hit rate for cost optimization

### 4. Progress Tracking
- Daily streaks
- Milestone badges (7, 30, 100 days)
- Automatic streak reset detection

---

## 🏗️ Architecture

### Technology Stack
- **API Gateway:** AWS API Gateway (REST API)
- **Compute:** AWS Lambda (Python 3.11)
- **Database:** DynamoDB
- **AI/ML:** Amazon Bedrock (Claude 3 Sonnet, Claude 3 Haiku)
- **RAG:** Amazon Bedrock Knowledge Bases + OpenSearch
- **Caching:** DynamoDB (LLM cache with 7-day TTL)
- **Monitoring:** CloudWatch, X-Ray, Sentry

### Budget Optimization
- **LLM Caching:** 80% cache hit rate = 80% cost savings
- **Model Selection:** Haiku for simple queries (10x cheaper than Sonnet)
- **DynamoDB:** On-demand billing
- **Lambda:** Pay per invocation

---

## 📊 API Metrics

### Performance Targets
- **P95 Latency:** < 500ms (cached), < 3s (Bedrock calls)
- **Availability:** 99.9%
- **Error Rate:** < 1%

### Cost Optimization
- **LLM Cache Hit Rate:** 80% target
- **Bedrock Token Usage:** Monitored via CloudWatch
- **Lambda Cold Starts:** < 5% of invocations

---

## 🔒 Security

### Authentication
- JWT tokens with 24-hour expiration
- Refresh tokens with 30-day expiration
- Bcrypt password hashing

### Rate Limiting
- Per-user limits (JWT-based)
- Per-IP limits (anonymous)
- Burst protection

### Data Protection
- DynamoDB encryption at rest
- TLS 1.3 for data in transit
- No PII in logs

---

## 📝 Error Handling

### Standard Error Response
```json
{
  "error": "Error message",
  "details": {
    "field": "field_name",
    "message": "Detailed error message"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

---

## 🧪 Testing the API

### Using cURL
See [API-QUICKSTART.md](./API-QUICKSTART.md) for cURL examples.

### Using Python
```python
import requests

BASE_URL = "https://api.codeflow.ai/v1"

# Register and get token
response = requests.post(f"{BASE_URL}/auth/register", json={
    "leetcode_username": "test_user",
    "email": "test@example.com",
    "password": "TestPass123!",
    "language_preference": "en"
})
token = response.json()["access_token"]

# Use token for authenticated requests
headers = {"Authorization": f"Bearer {token}"}
```

### Using Postman
1. Import `API-SPECIFICATION.yaml` into Postman
2. Set up environment variables for `base_url` and `access_token`
3. Test endpoints interactively

---

## 📚 Additional Resources

### Documentation
- **Architecture Diagrams:** [ARCHITECTURE-DIAGRAMS.md](./ARCHITECTURE-DIAGRAMS.md)
- **Deployment Guide:** [../../DEPLOYMENT-GUIDE.md](../../DEPLOYMENT-GUIDE.md)
- **Monitoring Guide:** [MONITORING-ACCESS.md](./MONITORING-ACCESS.md)

### Code Examples
- **Lambda Functions:** `../../lambda-functions/`
- **Infrastructure:** `../../infrastructure/`

### External Links
- **OpenAPI Specification:** https://swagger.io/specification/
- **Swagger Editor:** https://editor.swagger.io/
- **Redoc:** https://github.com/Redocly/redoc

---

## 🤝 Contributing

### Updating API Documentation

When adding or modifying endpoints:

1. **Update OpenAPI Spec:** Edit `API-SPECIFICATION.yaml`
2. **Update Markdown Docs:** Edit `API-DOCUMENTATION.md`
3. **Add Examples:** Update `API-QUICKSTART.md` if needed
4. **Test Changes:** Validate spec with Swagger Editor
5. **Update Version:** Increment version in `API-SPECIFICATION.yaml`

### Validation

```bash
# Validate OpenAPI spec
npx @apidevtools/swagger-cli validate infrastructure/docs/API-SPECIFICATION.yaml

# Generate HTML docs
redoc-cli bundle infrastructure/docs/API-SPECIFICATION.yaml \
  -o infrastructure/docs/api-docs.html
```

---

## 📞 Support

### Questions or Issues?
- **Email:** team@codeflow.ai
- **GitHub Issues:** https://github.com/codeflow-ai/platform/issues

### Team
- Lahar Joshi (Team Leader)
- Kushagra Pratap Rajput
- Harshita Devanani

---

## 📄 License

MIT License - See LICENSE file for details

---

**Last Updated:** January 2024

**API Version:** 1.0.0

**Region:** ap-south-1 (Mumbai)
