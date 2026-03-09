# CodeFlow AI Platform - Infrastructure Documentation

This directory contains documentation for the AWS infrastructure components of the CodeFlow AI Platform.

## Documentation Files

### Core Infrastructure
- **[API Gateway](./API-GATEWAY.md)**: REST API configuration, rate limiting, JWT validation
- **[Lambda Functions](./LAMBDA-FUNCTIONS.md)**: Serverless compute functions for auth, analysis, recommendations, chat mentor
- **[EventBridge](./EVENTBRIDGE.md)**: Event-driven architecture and async processing
- **[ECS Fargate](./ECS-FARGATE.md)**: Container-based heavy AI workloads (weakness analysis)
- **[CloudWatch](./CLOUDWATCH.md)**: Dashboards, alarms, and observability setup

### Data & Storage
- **[OpenSearch Setup](./README-opensearch.md)**: Vector search configuration and index initialization

### AI/ML Services
- **[Bedrock Setup](./BEDROCK-SETUP.md)**: Amazon Bedrock configuration, model access, Knowledge Base setup

## Quick Start

### Prerequisites
- AWS Account with appropriate permissions
- AWS CLI configured
- Node.js 18+ and npm
- AWS CDK CLI: `npm install -g aws-cdk`

### 1. Enable Bedrock Model Access

Before deploying the infrastructure, enable Bedrock model access:

```bash
# Run verification script
./infrastructure/scripts/enable-bedrock-models.sh
```

If models are not accessible, follow the instructions in [BEDROCK-SETUP.md](./BEDROCK-SETUP.md) to enable them through the AWS Console.

### 2. Deploy Infrastructure

```bash
cd infrastructure
npm install
cdk bootstrap  # First time only
cdk deploy --all
```

### 3. Initialize OpenSearch Indices

After deployment, initialize OpenSearch indices for vector search:

```bash
python3 infrastructure/scripts/init-opensearch-indices.py
```

### 4. Upload Knowledge Base Documents

Upload documents to populate the Bedrock Knowledge Base:

```bash
# Get bucket name from CDK outputs
KB_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name CodeFlowInfrastructureStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`KBDocumentsBucketName`].OutputValue' \
  --output text)

# Upload documents
aws s3 cp knowledge-base-docs/ s3://$KB_BUCKET/ --recursive
```

### 5. Trigger Initial Knowledge Base Sync

```bash
# Get Knowledge Base and Data Source IDs from CDK outputs
KB_ID=$(aws cloudformation describe-stacks \
  --stack-name CodeFlowInfrastructureStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`BedrockKnowledgeBaseId`].OutputValue' \
  --output text)

DS_ID=$(aws cloudformation describe-stacks \
  --stack-name CodeFlowInfrastructureStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`BedrockDataSourceId`].OutputValue' \
  --output text)

# Start ingestion job
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id $KB_ID \
  --data-source-id $DS_ID \
  --region us-east-1
```

## Architecture Overview

The CodeFlow AI Platform uses a serverless-first architecture with the following key components:

### Compute Layer
- **API Gateway**: REST API with rate limiting and JWT validation
- **Lambda Functions**: Serverless functions for core business logic
- **ECS Fargate**: Container-based tasks for heavy AI workloads

### Data Layer
- **DynamoDB**: NoSQL database for users, learning paths, progress, LLM cache
- **S3**: Object storage for static assets, knowledge base documents, datasets
- **OpenSearch**: Vector search for RAG (Retrieval-Augmented Generation)

### AI/ML Layer
- **Amazon Bedrock**: Claude 3 Sonnet for multi-step reasoning and conversational AI
- **Bedrock Knowledge Base**: Managed RAG system with OpenSearch integration
- **Titan Embeddings**: Vector embeddings for semantic search

### Event Processing
- **EventBridge**: Event bus for async orchestration
- **SQS**: Message queues for background jobs

### Observability
- **CloudWatch**: Logs, metrics, dashboards, alarms (see [CLOUDWATCH.md](./CLOUDWATCH.md))
- **X-Ray**: Distributed tracing
- **Sentry**: Error tracking (external)

## Cost Optimization

The infrastructure is designed with cost optimization in mind:

1. **LLM Caching**: DynamoDB-based cache reduces Bedrock costs by ~60%
2. **On-Demand Billing**: DynamoDB tables use on-demand billing mode
3. **Lambda**: Pay-per-invocation with optimized memory settings
4. **S3 Lifecycle Policies**: Automatic transition to IA and Glacier storage classes
5. **VPC Endpoints**: Gateway endpoints for S3 and DynamoDB (no data transfer charges)

## Security

Security best practices implemented:

1. **VPC Isolation**: Lambda and ECS tasks run in private subnets
2. **Security Groups**: Least-privilege network access
3. **IAM Roles**: Least-privilege permissions for all services
4. **Encryption**: At-rest encryption for DynamoDB, S3, OpenSearch
5. **TLS**: In-transit encryption for all API calls
6. **JWT Authentication**: Token-based authentication for API Gateway

## Monitoring & Alerts

CloudWatch dashboards and alarms provide comprehensive observability. See [CLOUDWATCH.md](./CLOUDWATCH.md) for details.

**Dashboards**:
- GenAI Performance: Bedrock latency, token usage, cache hit rate
- API Health: Request rate, error rate, latency, Lambda/DynamoDB metrics
- User Engagement: DAU, problems solved, learning paths generated

**Alarms**:
- API error rate > 5% for 5 minutes
- Bedrock P95 latency > 10s
- DynamoDB throttling events
- Lambda concurrent executions > 800
- ECS task failures > 3 in 10 minutes
- LLM cache hit rate < 40%

All alarms send notifications to SNS topic: `codeflow-alarms-{environment}`

## Troubleshooting

### Common Issues

1. **Bedrock Access Denied**: Enable model access in Bedrock Console
2. **OpenSearch Connection Failed**: Check security group and VPC configuration
3. **Lambda Timeout**: Increase timeout or optimize function code
4. **DynamoDB Throttling**: Switch to provisioned capacity or increase on-demand limits

### Useful Commands

```bash
# View CloudFormation stack outputs
aws cloudformation describe-stacks \
  --stack-name CodeFlowInfrastructureStack-dev \
  --query 'Stacks[0].Outputs'

# View Lambda function logs
aws logs tail /aws/lambda/codeflow-chat-mentor-dev --follow

# Check OpenSearch cluster health
curl -X GET "https://OPENSEARCH_ENDPOINT/_cluster/health?pretty"

# List Bedrock ingestion jobs
aws bedrock-agent list-ingestion-jobs \
  --knowledge-base-id $KB_ID \
  --data-source-id $DS_ID
```

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [OpenSearch Documentation](https://opensearch.org/docs/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
