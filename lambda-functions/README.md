# CodeFlow AI Lambda Functions

This directory contains all Lambda functions for the CodeFlow AI platform.

## Functions Overview

### 1. Auth Function (`auth/`)
- **Purpose**: User authentication and JWT token management
- **Memory**: 512 MB
- **Timeout**: 10 seconds
- **Endpoints**:
  - `POST /auth/register` - Register new user
  - `POST /auth/login` - Login and generate JWT
  - `POST /auth/refresh` - Refresh JWT token
- **Permissions**:
  - DynamoDB: Read/Write on Users table
  - X-Ray: Tracing

### 2. Analysis Function (`analysis/`)
- **Purpose**: Profile analysis and topic proficiency calculation
- **Memory**: 1024 MB
- **Timeout**: 30 seconds
- **Endpoints**:
  - `POST /analyze/profile` - Analyze LeetCode profile
  - `GET /analyze/{user_id}/topics` - Get topic proficiency
  - `POST /analyze/{user_id}/sync` - Trigger manual sync
- **Permissions**:
  - DynamoDB: Read/Write on Users, Progress, Analytics tables
  - EventBridge: Publish events
  - X-Ray: Tracing

### 3. Recommendations Function (`recommendations/`)
- **Purpose**: Problem recommendations and learning path generation
- **Memory**: 1024 MB
- **Timeout**: 30 seconds
- **Endpoints**:
  - `POST /recommendations/generate-path` - Generate learning path
  - `GET /recommendations/next-problem` - Get next problem (Goldilocks)
  - `POST /recommendations/hint` - Generate hint
- **Permissions**:
  - DynamoDB: Read/Write on LearningPaths, LLMCache; Read on Users, Progress
  - Bedrock: Invoke Claude 3 Sonnet and Haiku
  - X-Ray: Tracing

### 4. Chat Mentor Function (`chat-mentor/`)
- **Purpose**: Conversational AI mentor with multi-step reasoning
- **Memory**: 2048 MB
- **Timeout**: 60 seconds
- **Endpoints**:
  - `POST /chat/message` - Send message to AI mentor
  - `GET /chat/history` - Get conversation history
  - `DELETE /chat/history` - Clear conversation history
- **Permissions**:
  - DynamoDB: Read/Write on ConversationHistory, LLMCache; Read on Users
  - Bedrock: Invoke models and Knowledge Base (RAG)
  - OpenSearch: Vector search
  - X-Ray: Tracing

### 5. Scraping Function (`scraping/`)
- **Purpose**: LeetCode data scraping with retry logic
- **Memory**: 1024 MB
- **Timeout**: 30 seconds
- **Endpoints**:
  - `POST /scraping/fetch-profile` - Fetch LeetCode profile
  - `POST /scraping/fetch-submissions` - Fetch submissions
  - `GET /scraping/status` - Get scraping status
- **Permissions**:
  - DynamoDB: Read/Write on Users table
  - S3: Read/Write on Datasets bucket
  - X-Ray: Tracing

## Shared Dependencies Layer

All functions use a shared Lambda layer containing:
- `boto3` - AWS SDK
- `pydantic` - Data validation
- `httpx` - HTTP client
- `orjson` - Fast JSON
- `PyJWT` - JWT handling
- `aws-xray-sdk` - X-Ray tracing

## Environment Variables

All functions receive these environment variables:
- `ENVIRONMENT` - Deployment environment (dev/staging/prod)
- `USERS_TABLE` - DynamoDB Users table name
- `LEARNING_PATHS_TABLE` - DynamoDB LearningPaths table name
- `PROGRESS_TABLE` - DynamoDB Progress table name
- `LLM_CACHE_TABLE` - DynamoDB LLMCache table name
- `CONVERSATION_HISTORY_TABLE` - DynamoDB ConversationHistory table name
- `KNOWLEDGE_BASE_TABLE` - DynamoDB KnowledgeBase table name
- `ANALYTICS_TABLE` - DynamoDB Analytics table name
- `OPENSEARCH_ENDPOINT` - OpenSearch domain endpoint
- `KB_DOCUMENTS_BUCKET` - S3 bucket for knowledge base documents
- `DATASETS_BUCKET` - S3 bucket for datasets
- `AWS_REGION` - AWS region

## VPC Configuration

All functions are deployed in VPC:
- **Subnets**: Private subnets with NAT Gateway
- **Security Group**: Lambda security group with OpenSearch access
- **VPC Endpoints**: S3 and DynamoDB gateway endpoints for cost optimization

## X-Ray Tracing

All functions have X-Ray tracing enabled for distributed tracing:
- Trace API Gateway → Lambda → DynamoDB
- Trace Lambda → Bedrock → OpenSearch
- Trace Lambda → EventBridge → ECS

## Deployment

Functions are deployed via AWS CDK:

```bash
cd infrastructure
npm run build
cdk deploy
```

## Local Development

To test functions locally:

```bash
# Install dependencies
cd lambda-functions/auth
pip install -r ../../lambda-layers/shared-dependencies/python/requirements.txt

# Run tests
pytest tests/

# Invoke locally with SAM
sam local invoke AuthFunction -e events/register.json
```

## Monitoring

- **CloudWatch Logs**: `/aws/lambda/codeflow-{function}-{environment}`
- **CloudWatch Metrics**: Invocations, Duration, Errors, Throttles
- **X-Ray Traces**: Service map and trace analysis
- **Alarms**: Error rate > 5%, Duration > P95 threshold

## Security

- **IAM Roles**: Least-privilege permissions per function
- **VPC**: Private subnet deployment
- **Encryption**: Data encrypted at rest and in transit
- **Secrets**: JWT secret stored in environment (TODO: migrate to Secrets Manager)

## Cost Optimization

- **Memory**: Right-sized per function (512MB-2048MB)
- **Timeout**: Optimized per function (10s-60s)
- **VPC Endpoints**: Free data transfer for S3 and DynamoDB
- **LLM Cache**: 60% cost reduction on Bedrock calls
