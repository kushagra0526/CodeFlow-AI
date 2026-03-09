# CodeFlow AI Platform - AWS Infrastructure

This directory contains the AWS CDK infrastructure code for the CodeFlow AI Platform.

## Architecture Overview

The infrastructure includes:

- **VPC Configuration**: Multi-AZ VPC with public, private, and isolated subnets
- **Security Groups**: Separate security groups for Lambda, OpenSearch, and ECS
- **VPC Endpoints**: S3 and DynamoDB gateway endpoints for cost optimization
- **Network Configuration**: NAT Gateway, Internet Gateway, and route tables

## Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- AWS account with appropriate permissions

## Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your AWS account details:
   - `AWS_ACCOUNT_ID`: Your AWS account ID
   - `AWS_REGION`: Target AWS region (default: ap-south-1 - Mumbai)
   - `ENVIRONMENT`: Environment name (dev, staging, prod)

## Deployment

### 1. Bootstrap CDK (First time only)

```bash
npm run cdk:bootstrap
```

### 2. Build TypeScript

```bash
npm run build
```

### 3. Synthesize CloudFormation Template

```bash
npm run cdk:synth
```

### 4. Deploy Infrastructure

```bash
npm run cdk:deploy
```

### 5. View Differences (before deploying changes)

```bash
npm run cdk:diff
```

## Infrastructure Components

### VPC Configuration

- **CIDR Block**: 10.0.0.0/16
- **Availability Zones**: 2
- **NAT Gateways**: 1 (cost-optimized for dev)

#### Subnets

1. **Public Subnets** (10.0.0.0/24, 10.0.1.0/24)
   - Internet-facing resources
   - NAT Gateway placement
   - Public IP assignment enabled

2. **Private Subnets** (10.0.2.0/24, 10.0.3.0/24)
   - Lambda functions
   - ECS Fargate tasks
   - Application layer

3. **Isolated Subnets** (10.0.4.0/24, 10.0.5.0/24)
   - OpenSearch domain
   - Database resources
   - No internet access

### Security Groups

1. **Lambda Security Group**
   - Allows outbound traffic to external APIs (LeetCode, Bedrock)
   - Used by all Lambda functions

2. **OpenSearch Security Group**
   - Allows inbound HTTPS (443) from Lambda
   - Isolated network access

3. **ECS Security Group**
   - Allows outbound traffic to AWS services
   - Used by Fargate tasks

### VPC Endpoints

- **S3 Gateway Endpoint**: Free data transfer for S3 access
- **DynamoDB Gateway Endpoint**: Free data transfer for DynamoDB access

### DynamoDB Tables

The infrastructure creates 7 DynamoDB tables with on-demand billing:

1. **Users Table** (`codeflow-users-{env}`)
   - PK: user_id
   - GSI: leetcode-username-index
   - Point-in-time recovery enabled

2. **LearningPaths Table** (`codeflow-learning-paths-{env}`)
   - PK: path_id
   - GSI: user-id-index
   - Point-in-time recovery enabled

3. **Progress Table** (`codeflow-progress-{env}`)
   - PK: progress_id (user_id#date format)
   - GSI: user-id-index
   - Point-in-time recovery enabled

4. **LLMCache Table** (`codeflow-llm-cache-{env}`)
   - PK: query_hash
   - TTL: 7 days
   - Point-in-time recovery enabled

5. **ConversationHistory Table** (`codeflow-conversation-history-{env}`)
   - PK: user_id, SK: timestamp
   - TTL: 90 days
   - Point-in-time recovery enabled

6. **KnowledgeBase Table** (`codeflow-knowledge-base-{env}`)
   - PK: doc_id
   - GSI: category-index, complexity-index
   - Point-in-time recovery enabled

7. **Analytics Table** (`codeflow-analytics-{env}`)
   - PK: date, SK: metric_type
   - Point-in-time recovery enabled

### S3 Buckets

The infrastructure creates 3 S3 buckets:

1. **Static Assets Bucket** (`codeflow-static-assets-{env}-{account}`)
   - React build artifacts, images, fonts, icons
   - Lifecycle: Transition to IA after 90 days
   - CORS enabled for frontend access

2. **Knowledge Base Documents Bucket** (`codeflow-kb-documents-{env}-{account}`)
   - Algorithm explanations, patterns, debugging guides
   - Versioning enabled
   - Lifecycle: IA after 90 days, old versions expire after 90 days
   - CORS enabled for Bedrock access

3. **Datasets Bucket** (`codeflow-datasets-{env}-{account}`)
   - LeetCode problem archives, user submission exports, analytics snapshots
   - Lifecycle: IA after 90 days, Glacier after 180 days

### Amazon OpenSearch Domain

The infrastructure creates an OpenSearch domain for vector search:

- **Domain Name**: `codeflow-opensearch-{env}`
- **Engine Version**: OpenSearch 2.11
- **Instance Type**: r6g.large.search (2 nodes)
- **Storage**: 100GB EBS GP3 per node (3000 IOPS, 125 MB/s throughput)
- **Network**: VPC-based deployment in private subnets with zone awareness
- **Encryption**: At-rest and node-to-node encryption enabled
- **HTTPS**: Enforced
- **Fine-grained Access Control**: Enabled with IAM role
- **Logging**: Slow search, app, and slow index logs enabled
- **Automated Snapshots**: Daily at 2 AM UTC

#### k-NN Configuration

The OpenSearch domain is configured for vector search with:

- **k-NN Plugin**: Enabled
- **Algorithm**: HNSW (Hierarchical Navigable Small World)
- **Distance Metric**: Cosine similarity
- **Vector Dimensions**: 1536 (Titan Embeddings)

#### Indices

Three indices are created for different knowledge base categories:

1. **codeflow-algorithms**: Algorithm explanations and patterns
2. **codeflow-patterns**: Common coding patterns (sliding window, two pointers, etc.)
3. **codeflow-debugging**: Debugging guides and tips

See [scripts/README-opensearch.md](scripts/README-opensearch.md) for detailed setup instructions.

## Stack Outputs

After deployment, the following outputs are available:

### Network Outputs
- `VPCId`: VPC identifier
- `VPCCidr`: VPC CIDR block
- `PublicSubnets`: Comma-separated list of public subnet IDs
- `PrivateSubnets`: Comma-separated list of private subnet IDs
- `IsolatedSubnets`: Comma-separated list of isolated subnet IDs
- `LambdaSecurityGroupId`: Lambda security group ID
- `OpenSearchSecurityGroupId`: OpenSearch security group ID
- `ECSSecurityGroupId`: ECS security group ID

### DynamoDB Outputs
- `UsersTableName`: Users table name
- `UsersTableArn`: Users table ARN
- `LearningPathsTableName`: Learning paths table name
- `LearningPathsTableArn`: Learning paths table ARN
- `ProgressTableName`: Progress table name
- `ProgressTableArn`: Progress table ARN
- `LLMCacheTableName`: LLM cache table name
- `LLMCacheTableArn`: LLM cache table ARN
- `ConversationHistoryTableName`: Conversation history table name
- `ConversationHistoryTableArn`: Conversation history table ARN
- `KnowledgeBaseTableName`: Knowledge base table name
- `KnowledgeBaseTableArn`: Knowledge base table ARN
- `AnalyticsTableName`: Analytics table name
- `AnalyticsTableArn`: Analytics table ARN

### S3 Outputs
- `StaticAssetsBucketName`: Static assets bucket name
- `StaticAssetsBucketArn`: Static assets bucket ARN
- `KBDocumentsBucketName`: Knowledge base documents bucket name
- `KBDocumentsBucketArn`: Knowledge base documents bucket ARN
- `DatasetsBucketName`: Datasets bucket name
- `DatasetsBucketArn`: Datasets bucket ARN

### OpenSearch Outputs
- `OpenSearchDomainName`: OpenSearch domain name
- `OpenSearchDomainArn`: OpenSearch domain ARN
- `OpenSearchDomainEndpoint`: OpenSearch domain endpoint
- `OpenSearchDashboardsUrl`: OpenSearch Dashboards URL

## Cost Optimization

- Single NAT Gateway for development (can scale to multi-AZ for production)
- VPC Gateway Endpoints for S3 and DynamoDB (no data transfer charges)
- Right-sized subnets with /24 CIDR blocks
- VPC Flow Logs with 1-week retention

## Cleanup

To destroy all infrastructure:

```bash
npm run cdk:destroy
```

**Warning**: This will delete all resources. Make sure to backup any data before destroying.

## Next Steps

After deploying the core infrastructure, proceed with:

1. ✅ Task 1.1: Initialize AWS CDK project (Complete)
2. ✅ Task 1.2: Create DynamoDB tables (Complete)
3. ✅ Task 1.3: Set up S3 buckets (Complete)
4. ✅ Task 1.4: Configure OpenSearch domain (Complete)
5. **Initialize OpenSearch indices**: Run the initialization script to create k-NN enabled indices
   ```bash
   cd scripts
   pip install -r requirements.txt
   python init-opensearch-indices.py --endpoint <opensearch-endpoint> --region us-east-1
   ```
6. Task 1.5: Set up API Gateway
7. Task 1.6: Create Lambda functions
8. Task 1.7: Configure EventBridge
9. Task 1.8: Set up ECS Fargate cluster
10. Task 1.9: Configure Bedrock and Knowledge Base

## Troubleshooting

### CDK Bootstrap Error

If you encounter bootstrap errors:
```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

### TypeScript Compilation Errors

Rebuild the project:
```bash
npm run build
```

### Permission Errors

Ensure your AWS credentials have the following permissions:
- EC2 (VPC, Subnets, Security Groups)
- CloudFormation
- IAM (for CDK execution role)
- CloudWatch Logs

## Support

For issues or questions, refer to:
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [CodeFlow AI Design Document](.kiro/specs/codeflow-ai-platform/design.md)
