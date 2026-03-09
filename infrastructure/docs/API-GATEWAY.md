# API Gateway Configuration

## Overview

The CodeFlow AI Platform uses AWS API Gateway as the entry point for all backend API requests. The API Gateway is configured with comprehensive security, rate limiting, request validation, and CORS support.

## Architecture

```
Client (React) → API Gateway → Lambda Authorizer (JWT) → Lambda Functions
                      ↓
                Rate Limiting
                Request Validation
                CORS
```

## Key Features

### 1. REST API Gateway

- **Type**: Regional REST API
- **Stage**: Environment-based (dev, staging, prod)
- **Endpoint**: `https://{api-id}.execute-api.{region}.amazonaws.com/{stage}`

### 2. Authentication & Authorization

#### Lambda Authorizer (JWT Validation)

- **Type**: Request Authorizer
- **Identity Source**: `Authorization` header
- **Cache TTL**: 5 minutes
- **Function**: `codeflow-jwt-authorizer-{environment}`

The Lambda authorizer validates JWT tokens and returns an IAM policy allowing or denying access. It extracts the `user_id` from the token claims and passes it to downstream Lambda functions via the request context.

**Current Implementation**: Placeholder that accepts any Bearer token. 

**TODO**: Implement proper JWT validation:
- Verify JWT signature using public key or secret
- Check token expiration
- Validate token claims (issuer, audience)
- Extract user_id from token payload

### 3. Rate Limiting

Three usage plans are configured:

#### Authenticated Users (Per User)
- **Rate Limit**: 100 requests/minute
- **Burst Limit**: 200 requests
- **Quota**: 10,000 requests/month
- **Usage Plan**: `codeflow-user-plan-{environment}`

#### Anonymous Users (Per IP)
- **Rate Limit**: 10 requests/minute
- **Burst Limit**: 20 requests
- **Quota**: 1,000 requests/month
- **Usage Plan**: `codeflow-anonymous-plan-{environment}`

#### Admin Users (API Key)
- **Rate Limit**: 500 requests/minute
- **Burst Limit**: 1,000 requests
- **Quota**: 100,000 requests/month
- **Usage Plan**: `codeflow-admin-plan-{environment}`
- **API Key**: `codeflow-admin-key-{environment}`

### 4. CORS Configuration

Configured to allow requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative dev port)
- `https://codeflow.ai` (Production domain)

**Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers**:
- Content-Type
- Authorization
- X-Request-ID
- X-Amz-Date
- X-Api-Key
- X-Amz-Security-Token

**Credentials**: Enabled

**Max Age**: 1 hour

### 5. Request Validation

Request validation is enabled for both request body and parameters using JSON schemas.

#### Validation Models

**RegisterRequestModel**:
```json
{
  "username": "string (3-50 chars, alphanumeric + _ -)",
  "password": "string (8-128 chars)",
  "leetcode_username": "string (1-50 chars)"
}
```

**LoginRequestModel**:
```json
{
  "username": "string (3-50 chars)",
  "password": "string (8-128 chars)"
}
```

**ChatMessageRequestModel**:
```json
{
  "message": "string (1-5000 chars)",
  "code": "string (optional, max 10000 chars)",
  "problem_id": "string (optional, max 100 chars)"
}
```

### 6. Logging & Monitoring

#### Access Logs
- **Log Group**: `/aws/apigateway/codeflow-{environment}`
- **Format**: JSON with standard fields (caller, method, IP, status, etc.)
- **Retention**: 7 days

#### CloudWatch Metrics
- Request count
- Latency (P50, P95, P99)
- 4XX and 5XX error rates
- Integration latency

#### X-Ray Tracing
- Enabled for distributed tracing
- Traces requests from API Gateway → Lambda → DynamoDB/Bedrock

### 7. API Resource Structure

The following resources are created (Lambda integrations to be added in task 1.6):

```
/
├── /auth
│   ├── POST /register
│   └── POST /login
├── /analyze
│   └── POST /profile
├── /chat
│   └── POST /message
├── /recommendations
│   └── GET /next-problem
├── /progress
│   └── GET /{user_id}
└── /admin
    ├── GET /analytics/dau
    └── GET /analytics/retention
```

## Deployment

The API Gateway is deployed as part of the CDK stack:

```bash
cd infrastructure
npm run build
cdk deploy --all
```

## Outputs

After deployment, the following outputs are available:

- `RestApiId`: API Gateway ID
- `RestApiUrl`: Base URL for API requests
- `RestApiRootResourceId`: Root resource ID for adding methods
- `JWTAuthorizerArn`: ARN of the JWT Lambda authorizer

## Usage Examples

### Authenticated Request

```bash
curl -X POST https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/chat/message \
  -H "Authorization: Bearer {jwt-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I solve this problem?",
    "problem_id": "two-sum"
  }'
```

### Admin Request (with API Key)

```bash
curl -X GET https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/admin/analytics/dau \
  -H "X-Api-Key: {admin-api-key}"
```

## Security Best Practices

1. **JWT Validation**: Implement proper JWT validation in the Lambda authorizer
2. **HTTPS Only**: API Gateway enforces HTTPS for all requests
3. **API Keys**: Rotate admin API keys regularly
4. **Rate Limiting**: Monitor usage patterns and adjust limits as needed
5. **CORS**: Restrict allowed origins to specific domains in production
6. **Request Validation**: Always validate request payloads using JSON schemas
7. **Logging**: Monitor access logs for suspicious activity

## Cost Optimization

- **Caching**: Authorization results are cached for 5 minutes to reduce Lambda invocations
- **Regional Endpoint**: Uses regional endpoint (cheaper than edge-optimized)
- **Usage Plans**: Prevents abuse and controls costs through rate limiting

## Next Steps

1. **Task 1.6**: Create Lambda functions and integrate with API Gateway
2. **Task 2.1**: Implement proper JWT validation in the authorizer function
3. **Task 8.1**: Update React frontend to use the API Gateway URL
4. **Task 12.4**: Configure custom domain with Route 53 and ACM certificate

## References

- [AWS API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [Lambda Authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)
- [Usage Plans](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-usage-plans.html)
