# Lambda Functions Architecture

This document describes the Lambda functions architecture for the CodeFlow AI platform.

## Overview

The platform uses 5 Lambda functions, each with specific responsibilities and optimized configurations:

| Function | Memory | Timeout | Purpose |
|----------|--------|---------|---------|
| Auth | 512 MB | 10s | User authentication and JWT management |
| Analysis | 1024 MB | 30s | Profile analysis and topic proficiency |
| Recommendations | 1024 MB | 30s | Problem recommendations and learning paths |
| Chat Mentor | 2048 MB | 60s | Conversational AI with RAG and Bedrock |
| Scraping | 1024 MB | 30s | LeetCode data scraping with retry logic |

## Shared Dependencies Layer

All functions share a common Lambda layer containing:

- **boto3** (>=1.34.0) - AWS SDK for Python
- **pydantic** (>=2.5.0) - Data validation and serialization
- **httpx** (>=0.26.0) - Modern async HTTP client
- **orjson** (>=3.9.0) - Fast JSON serialization
- **PyJWT** (>=2.8.0) - JWT token handling
- **aws-xray-sdk** (>=2.12.0) - Distributed tracing

**Benefits:**
- Reduced deployment package size per function
- Consistent dependency versions across functions
- Faster deployments (layer cached by Lambda)
- Easier dependency management

## Function Details

### 1. Auth Function

**Endpoints:**
- `POST /auth/register` - Register new user with LeetCode username
- `POST /auth/login` - Login and generate JWT token
- `POST /auth/refresh` - Refresh expired JWT token

**IAM Permissions:**
- DynamoDB: Read/Write on Users table
- X-Ray: Tracing

**Environment Variables:**
- `JWT_SECRET` - Secret for JWT signing (TODO: migrate to Secrets Manager)
- All common environment variables

**Implementation Status:** Placeholder with routing logic

### 2. Analysis Function

**Endpoints:**
- `POST /analyze/profile` - Analyze LeetCode profile and calculate proficiency
- `GET /analyze/{user_id}/topics` - Get topic proficiency breakdown
- `POST /analyze/{user_id}/sync` - Trigger manual sync with LeetCode

**IAM Permissions:**
- DynamoDB: Read/Write on Users, Progress, Analytics tables
- EventBridge: Publish ProfileAnalysisComplete events
- X-Ray: Tracing

**Key Features:**
- Topic classification (weak/moderate/strong)
- Proficiency calculation: (solved/attempted) × 100
- Event-driven architecture (publishes to EventBridge)

**Implementation Status:** Placeholder with routing logic

### 3. Recommendations Function

**Endpoints:**
- `POST /recommendations/generate-path` - Generate personalized learning path
- `GET /recommendations/next-problem` - Get next problem (Goldilocks algorithm)
- `POST /recommendations/hint` - Generate progressive hints

**IAM Permissions:**
- DynamoDB: Read/Write on LearningPaths, LLMCache; Read on Users, Progress
- Bedrock: Invoke Claude 3 Sonnet and Haiku models
- X-Ray: Tracing

**Key Features:**
- Goldilocks algorithm for adaptive difficulty
- Learning path generation with Bedrock
- LLM caching for cost optimization
- Progressive hint system (levels 1-3)

**Implementation Status:** Placeholder with routing logic

### 4. Chat Mentor Function

**Endpoints:**
- `POST /chat/message` - Send message to AI mentor
- `GET /chat/history` - Get conversation history
- `DELETE /chat/history` - Clear conversation history

**IAM Permissions:**
- DynamoDB: Read/Write on ConversationHistory, LLMCache; Read on Users
- Bedrock: Invoke models and Knowledge Base (RAG)
- OpenSearch: Vector search for RAG
- X-Ray: Tracing

**Multi-Step Reasoning Pipeline:**
1. **Intent Detection** - Classify user query (CODE_DEBUGGING, CONCEPT_QUESTION, etc.)
2. **Cache Check** - Check LLM cache for similar queries
3. **RAG Retrieval** - Fetch relevant knowledge from OpenSearch
4. **Code Analysis** - Analyze user's code (if provided)
5. **Bedrock Reasoning** - Generate response with Claude 3 Sonnet
6. **Response Generation** - Format and store response

**Key Features:**
- Multi-step reasoning with context enrichment
- RAG integration with Bedrock Knowledge Bases
- LLM caching (60% cost reduction)
- Conversation history with 90-day TTL
- Code analysis and debugging assistance

**Implementation Status:** Placeholder with pipeline structure

### 5. Scraping Function

**Endpoints:**
- `POST /scraping/fetch-profile` - Fetch LeetCode profile
- `POST /scraping/fetch-submissions` - Fetch user submissions
- `GET /scraping/status` - Get scraping status

**IAM Permissions:**
- DynamoDB: Read/Write on Users table
- S3: Read/Write on Datasets bucket
- X-Ray: Tracing

**Key Features:**
- Exponential backoff retry logic (1s, 2s, 4s, 8s)
- Rate limit compliance (max 10 req/min)
- GraphQL query support for LeetCode API
- Data caching in S3 and DynamoDB

**Implementation Status:** Placeholder with retry logic structure

## VPC Configuration

All Lambda functions are deployed in VPC for security:

**Network Setup:**
- **Subnets**: Private subnets with NAT Gateway for internet access
- **Security Group**: Lambda security group with egress to OpenSearch
- **VPC Endpoints**: S3 and DynamoDB gateway endpoints (free data transfer)

**Benefits:**
- Secure access to OpenSearch in VPC
- Cost optimization with VPC endpoints
- Network isolation from public internet
- Controlled egress through NAT Gateway

## X-Ray Tracing

All functions have X-Ray tracing enabled:

**Traced Operations:**
- API Gateway → Lambda invocation
- Lambda → DynamoDB operations
- Lambda → Bedrock API calls
- Lambda → OpenSearch queries
- Lambda → EventBridge events

**Benefits:**
- End-to-end request tracing
- Performance bottleneck identification
- Service dependency mapping
- Error root cause analysis

## Environment Variables

All functions receive these common environment variables:

```typescript
{
  ENVIRONMENT: 'dev|staging|prod',
  USERS_TABLE: 'codeflow-users-{env}',
  LEARNING_PATHS_TABLE: 'codeflow-learning-paths-{env}',
  PROGRESS_TABLE: 'codeflow-progress-{env}',
  LLM_CACHE_TABLE: 'codeflow-llm-cache-{env}',
  CONVERSATION_HISTORY_TABLE: 'codeflow-conversation-history-{env}',
  KNOWLEDGE_BASE_TABLE: 'codeflow-knowledge-base-{env}',
  ANALYTICS_TABLE: 'codeflow-analytics-{env}',
  OPENSEARCH_ENDPOINT: 'vpc-codeflow-opensearch-{env}-xxx.{region}.es.amazonaws.com',
  KB_DOCUMENTS_BUCKET: 'codeflow-kb-documents-{env}-{account}',
  DATASETS_BUCKET: 'codeflow-datasets-{env}-{account}',
  AWS_REGION: 'us-east-1'
}
```

## IAM Roles and Permissions

Each function has a dedicated IAM role with least-privilege permissions:

### Auth Function Role
- `dynamodb:GetItem`, `dynamodb:PutItem`, `dynamodb:Query` on Users table
- `xray:PutTraceSegments`, `xray:PutTelemetryRecords`
- VPC execution role (ENI management)

### Analysis Function Role
- DynamoDB permissions on Users, Progress, Analytics tables
- `events:PutEvents` on EventBridge
- X-Ray and VPC permissions

### Recommendations Function Role
- DynamoDB permissions on LearningPaths, LLMCache, Users, Progress tables
- `bedrock:InvokeModel` on Claude 3 Sonnet and Haiku
- X-Ray and VPC permissions

### Chat Mentor Function Role
- DynamoDB permissions on ConversationHistory, LLMCache, Users tables
- `bedrock:InvokeModel`, `bedrock:Retrieve`, `bedrock:RetrieveAndGenerate`
- `es:ESHttpGet`, `es:ESHttpPost`, `es:ESHttpPut` on OpenSearch
- X-Ray and VPC permissions

### Scraping Function Role
- DynamoDB permissions on Users table
- `s3:GetObject`, `s3:PutObject` on Datasets bucket
- X-Ray and VPC permissions

## Monitoring and Logging

### CloudWatch Logs
- Log Group: `/aws/lambda/codeflow-{function}-{env}`
- Retention: 7 days
- Log Level: INFO

### CloudWatch Metrics
- Invocations
- Duration (P50, P95, P99)
- Errors
- Throttles
- Concurrent Executions

### CloudWatch Alarms
- Error rate > 5% for 5 minutes
- Duration > P95 threshold
- Throttles > 10 in 5 minutes

## Cost Optimization

### Memory Allocation
Functions are right-sized based on workload:
- Auth: 512 MB (lightweight operations)
- Analysis: 1024 MB (data processing)
- Recommendations: 1024 MB (Bedrock calls)
- Chat Mentor: 2048 MB (complex reasoning + RAG)
- Scraping: 1024 MB (HTTP requests + parsing)

### Timeout Configuration
Timeouts are optimized to prevent unnecessary charges:
- Auth: 10s (fast operations)
- Analysis: 30s (profile parsing)
- Recommendations: 30s (Bedrock generation)
- Chat Mentor: 60s (multi-step pipeline)
- Scraping: 30s (with retry logic)

### VPC Endpoints
Using S3 and DynamoDB gateway endpoints eliminates data transfer charges within the same region.

### LLM Caching
Semantic caching in DynamoDB reduces Bedrock costs by ~60% for repeated queries.

## Deployment

Functions are deployed via AWS CDK:

```bash
cd infrastructure
npm run build
cdk deploy
```

See [DEPLOYMENT.md](../lambda-functions/DEPLOYMENT.md) for detailed deployment instructions.

## Next Steps

1. **Implement Business Logic**: Replace placeholder code with actual implementations
2. **Add Unit Tests**: Write tests for each function
3. **API Gateway Integration**: Connect functions to API Gateway endpoints (Task 1.7)
4. **EventBridge Rules**: Set up event routing (Task 1.7)
5. **Secrets Management**: Migrate JWT_SECRET to AWS Secrets Manager
6. **Performance Testing**: Load test with realistic workloads
7. **Security Hardening**: Review IAM policies and add WAF rules

## References

- [Lambda Functions README](../lambda-functions/README.md)
- [Lambda Layer Build Script](../lambda-layers/shared-dependencies/build.sh)
- [Deployment Guide](../lambda-functions/DEPLOYMENT.md)
- [CDK Stack](../lib/codeflow-infrastructure-stack.ts)
