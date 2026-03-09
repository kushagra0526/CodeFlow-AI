# Amazon Bedrock Setup Guide

This guide explains how to configure Amazon Bedrock for the CodeFlow AI Platform, including model access enablement and Knowledge Base setup.

## Overview

The CodeFlow AI Platform uses Amazon Bedrock for:
- **Claude 3 Sonnet**: Multi-step reasoning, learning path generation, and conversational AI mentor
- **Titan Embeddings**: Vector embeddings for RAG (Retrieval-Augmented Generation)
- **Knowledge Base**: Managed RAG system with OpenSearch integration

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- CDK infrastructure deployed (VPC, OpenSearch, S3 buckets)

## Step 1: Enable Bedrock Model Access

Model access must be enabled manually through the AWS Console or CLI before deploying the CDK stack.

### Option A: AWS Console

1. Navigate to the [Amazon Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Select your region (e.g., `us-east-1`)
3. Go to **Model access** in the left sidebar
4. Click **Manage model access**
5. Enable the following models:
   - **Claude 3 Sonnet** (`anthropic.claude-3-sonnet-20240229-v1:0`)
   - **Claude 3 Haiku** (`anthropic.claude-3-haiku-20240307-v1:0`) - Optional, for fallback
   - **Titan Embeddings G1 - Text** (`amazon.titan-embed-text-v1`)
6. Click **Save changes**
7. Wait for model access to be granted (usually takes a few minutes)

### Option B: AWS CLI

```bash
# Enable Claude 3 Sonnet
aws bedrock put-model-invocation-logging-configuration \
  --region us-east-1 \
  --logging-config '{
    "cloudWatchConfig": {
      "logGroupName": "/aws/bedrock/modelinvocations",
      "roleArn": "arn:aws:iam::ACCOUNT_ID:role/BedrockLoggingRole"
    }
  }'

# Note: Model access enablement via CLI requires submitting a request
# It's recommended to use the AWS Console for model access enablement
```

### Verify Model Access

```bash
# List available models
aws bedrock list-foundation-models --region us-east-1

# Check if specific model is accessible
aws bedrock get-foundation-model \
  --model-identifier anthropic.claude-3-sonnet-20240229-v1:0 \
  --region us-east-1
```

## Step 2: Deploy CDK Stack with Bedrock Configuration

Once model access is enabled, deploy the CDK stack:

```bash
cd infrastructure
npm install
cdk deploy --all
```

The CDK stack will create:
- **Bedrock Knowledge Base**: `kb-codeflow-algorithms-{environment}`
- **S3 Data Source**: Connected to `codeflow-kb-documents-{environment}` bucket
- **OpenSearch Integration**: Vector index `codeflow-kb-index`
- **Daily Sync Schedule**: EventBridge rule triggering at 2 AM UTC
- **IAM Roles**: Permissions for Bedrock to access S3 and OpenSearch

## Step 3: Verify Knowledge Base Creation

After deployment, verify the Knowledge Base was created:

```bash
# Get Knowledge Base ID from CDK outputs
KB_ID=$(aws cloudformation describe-stacks \
  --stack-name CodeFlowInfrastructureStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`BedrockKnowledgeBaseId`].OutputValue' \
  --output text)

echo "Knowledge Base ID: $KB_ID"

# Describe Knowledge Base
aws bedrock-agent get-knowledge-base \
  --knowledge-base-id $KB_ID \
  --region us-east-1
```

## Step 4: Upload Knowledge Base Documents

Upload documents to the S3 bucket to populate the Knowledge Base:

```bash
# Get S3 bucket name from CDK outputs
KB_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name CodeFlowInfrastructureStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`KBDocumentsBucketName`].OutputValue' \
  --output text)

echo "Knowledge Base Bucket: $KB_BUCKET"

# Upload sample documents (create these first)
aws s3 cp algorithms/ s3://$KB_BUCKET/algorithms/ --recursive
aws s3 cp patterns/ s3://$KB_BUCKET/patterns/ --recursive
aws s3 cp debugging/ s3://$KB_BUCKET/debugging/ --recursive
aws s3 cp interview/ s3://$KB_BUCKET/interview/ --recursive
```

## Step 5: Trigger Initial Sync

Trigger the first ingestion job to index the documents:

```bash
# Get Data Source ID from CDK outputs
DS_ID=$(aws cloudformation describe-stacks \
  --stack-name CodeFlowInfrastructureStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`BedrockDataSourceId`].OutputValue' \
  --output text)

echo "Data Source ID: $DS_ID"

# Start ingestion job
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id $KB_ID \
  --data-source-id $DS_ID \
  --region us-east-1

# Check ingestion job status
aws bedrock-agent list-ingestion-jobs \
  --knowledge-base-id $KB_ID \
  --data-source-id $DS_ID \
  --region us-east-1
```

## Step 6: Test Knowledge Base Retrieval

Test the Knowledge Base with a sample query:

```bash
# Test retrieval
aws bedrock-agent-runtime retrieve \
  --knowledge-base-id $KB_ID \
  --retrieval-query '{"text": "Explain dynamic programming"}' \
  --region us-east-1

# Test retrieve and generate (RAG)
aws bedrock-agent-runtime retrieve-and-generate \
  --input '{"text": "What is the sliding window pattern?"}' \
  --retrieve-and-generate-configuration '{
    "type": "KNOWLEDGE_BASE",
    "knowledgeBaseConfiguration": {
      "knowledgeBaseId": "'$KB_ID'",
      "modelArn": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
    }
  }' \
  --region us-east-1
```

## Architecture Details

### Knowledge Base Configuration

- **Name**: `kb-codeflow-algorithms-{environment}`
- **Embedding Model**: `amazon.titan-embed-text-v1` (1536 dimensions)
- **Vector Store**: OpenSearch with k-NN index
- **Chunking Strategy**: Fixed size (500 tokens, 10% overlap)
- **Data Source**: S3 bucket with prefixes: `algorithms/`, `patterns/`, `debugging/`, `interview/`

### Sync Schedule

- **Frequency**: Daily at 2 AM UTC
- **Trigger**: EventBridge rule → Lambda function → Bedrock StartIngestionJob API
- **Retry Policy**: 2 retries with 2-hour max event age

### IAM Permissions

The Bedrock Knowledge Base role has permissions to:
- Read from S3 bucket (`codeflow-kb-documents-{environment}`)
- Access OpenSearch domain for vector indexing
- Invoke Titan Embeddings model

Lambda functions have permissions to:
- Invoke Claude 3 Sonnet and Haiku models
- Retrieve from Knowledge Base
- Use RetrieveAndGenerate API

## Monitoring

### CloudWatch Metrics

Monitor Bedrock usage in CloudWatch:
- `bedrock:InvocationCount` - Number of model invocations
- `bedrock:InvocationLatency` - Model response time
- `bedrock:TokenCount` - Input/output tokens used

### CloudWatch Logs

View logs for:
- Lambda function: `/aws/lambda/codeflow-kb-sync-{environment}`
- Bedrock invocations: `/aws/bedrock/modelinvocations` (if logging enabled)

### Cost Tracking

Track costs using AWS Cost Explorer:
- **Claude 3 Sonnet**: $3 per 1M input tokens, $15 per 1M output tokens
- **Titan Embeddings**: $0.10 per 1M tokens
- **Knowledge Base**: $0.10 per 1M tokens indexed + OpenSearch costs

## Troubleshooting

### Model Access Denied

**Error**: `AccessDeniedException: You don't have access to the model`

**Solution**: Enable model access in the Bedrock Console (Step 1)

### Knowledge Base Creation Failed

**Error**: `InvalidRequestException: OpenSearch domain not accessible`

**Solution**: 
1. Verify OpenSearch domain is running
2. Check security group allows Bedrock service access
3. Verify IAM role has correct permissions

### Ingestion Job Failed

**Error**: `ValidationException: S3 bucket is empty`

**Solution**: Upload documents to S3 bucket before triggering ingestion (Step 4)

### Retrieval Returns No Results

**Possible Causes**:
1. Ingestion job not completed - Check job status
2. Query doesn't match indexed content - Try different queries
3. Vector index not created - Verify OpenSearch index exists

**Debug Steps**:
```bash
# Check ingestion job status
aws bedrock-agent list-ingestion-jobs \
  --knowledge-base-id $KB_ID \
  --data-source-id $DS_ID \
  --region us-east-1

# Verify documents in S3
aws s3 ls s3://$KB_BUCKET/ --recursive

# Check OpenSearch index
curl -X GET "https://OPENSEARCH_ENDPOINT/codeflow-kb-index/_search?pretty" \
  -u "username:password"
```

## Best Practices

1. **Document Structure**: Use markdown with clear headings and metadata
2. **Chunking**: Keep chunks focused on single concepts (500 tokens works well)
3. **Metadata**: Add frontmatter with category, complexity, topics for filtering
4. **Sync Frequency**: Daily sync is sufficient for most use cases
5. **Cost Optimization**: Use LLM caching to reduce duplicate queries (60% savings)
6. **Monitoring**: Set up CloudWatch alarms for high latency or error rates

## References

- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Bedrock Knowledge Bases Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html)
- [Claude 3 Model Card](https://docs.anthropic.com/claude/docs/models-overview)
- [Titan Embeddings Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/titan-embedding-models.html)
