# ECS Fargate Configuration

## Overview

The CodeFlow AI Platform uses Amazon ECS Fargate for heavy AI workloads that exceed Lambda's timeout limits. This document describes the ECS Fargate cluster configuration and deployment process.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      EventBridge Event Bus                       │
│                    (codeflow-events-{env})                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ ProfileAnalysisComplete event
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EventBridge Rule                              │
│              (Profile Analysis Complete)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│    SQS Queue             │  │    ECS Fargate Task      │
│ (Background Jobs)        │  │  (Weakness Analysis)     │
│                          │  │                          │
│ - Visibility: 15 min     │  │ - CPU: 2 vCPU            │
│ - Retention: 4 days      │  │ - Memory: 4GB            │
│ - DLQ: After 3 retries   │  │ - Timeout: 15 min        │
└──────────────────────────┘  └──────────────────────────┘
                                        │
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
        │   Amazon Bedrock │  │    DynamoDB      │  │   CloudWatch     │
        │  (Claude Sonnet) │  │  (Learning Paths)│  │     Logs         │
        └──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Components

### 1. ECS Cluster

**Name**: `codeflow-workers-{environment}`

**Configuration**:
- VPC: Private subnets with NAT Gateway
- Container Insights: Enabled
- Capacity Providers: FARGATE, FARGATE_SPOT

**Purpose**: Hosts Fargate tasks for heavy AI processing

### 2. ECR Repository

**Name**: `codeflow-workers-{environment}`

**Configuration**:
- Image Scanning: Enabled on push
- Tag Mutability: Mutable
- Lifecycle Policy:
  - Keep last 10 images
  - Remove untagged images after 7 days

**Purpose**: Stores Docker images for ECS tasks

### 3. Task Definition

**Family**: `codeflow-weakness-analysis-{environment}`

**Resources**:
- CPU: 2048 (2 vCPU)
- Memory: 4096 MB (4 GB)
- Network Mode: awsvpc
- Launch Type: FARGATE

**Container**:
- Name: `weakness-analyzer`
- Image: `{account}.dkr.ecr.{region}.amazonaws.com/codeflow-workers-{env}:latest`
- Essential: true
- Port Mappings: None (worker doesn't expose ports)

**Environment Variables**:
- `ENVIRONMENT`: Deployment environment
- `USERS_TABLE`: DynamoDB Users table name
- `LEARNING_PATHS_TABLE`: DynamoDB Learning Paths table name
- `PROGRESS_TABLE`: DynamoDB Progress table name
- `LLM_CACHE_TABLE`: DynamoDB LLM Cache table name
- `CONVERSATION_HISTORY_TABLE`: DynamoDB Conversation History table name
- `KNOWLEDGE_BASE_TABLE`: DynamoDB Knowledge Base table name
- `ANALYTICS_TABLE`: DynamoDB Analytics table name
- `OPENSEARCH_ENDPOINT`: OpenSearch domain endpoint
- `KB_DOCUMENTS_BUCKET`: S3 bucket for knowledge base documents
- `DATASETS_BUCKET`: S3 bucket for datasets
- `AWS_REGION`: AWS region
- `EVENT_BUS_NAME`: EventBridge event bus name
- `BACKGROUND_JOBS_QUEUE_URL`: SQS queue URL
- `WORKER_TYPE`: Worker type identifier

**Logging**:
- Driver: awslogs
- Log Group: `/ecs/codeflow-workers-{environment}`
- Stream Prefix: `weakness-analysis`
- Retention: 14 days

**Health Check**:
- Command: `CMD-SHELL echo "healthy" || exit 1`
- Interval: 30 seconds
- Timeout: 5 seconds
- Retries: 3
- Start Period: 60 seconds

### 4. IAM Roles

#### Task Execution Role

**Name**: `codeflow-ecs-execution-role-{environment}`

**Purpose**: Allows ECS to pull images from ECR and write logs to CloudWatch

**Permissions**:
- `AmazonECSTaskExecutionRolePolicy` (managed policy)
- ECR: Pull images from repository
- CloudWatch Logs: Create log streams and put log events

#### Task Role

**Name**: `codeflow-ecs-task-role-{environment}`

**Purpose**: Grants application permissions to AWS services

**Permissions**:
- **DynamoDB**: Read/write access to:
  - Users table
  - Learning Paths table
  - Progress table (read-only)
  - LLM Cache table
- **S3**: Read/write access to:
  - Datasets bucket
- **Bedrock**: Invoke model permissions for:
  - Claude 3 Sonnet
  - Claude 3 Haiku
- **SQS**: Consume messages from:
  - Background Jobs queue
- **X-Ray**: Put trace segments and telemetry

### 5. Security Groups

**Name**: `codeflow-ecs-sg-{environment}`

**Inbound Rules**: None (tasks don't accept incoming connections)

**Outbound Rules**: All traffic allowed (tasks need to call AWS services)

**Purpose**: Network isolation for ECS tasks

### 6. CloudWatch Log Group

**Name**: `/ecs/codeflow-workers-{environment}`

**Retention**: 14 days

**Purpose**: Centralized logging for all ECS tasks

## EventBridge Integration

### Event Pattern

```json
{
  "source": ["codeflow.analysis"],
  "detail-type": ["ProfileAnalysisComplete"]
}
```

### Event Payload

```json
{
  "version": "0",
  "id": "event-id",
  "detail-type": "ProfileAnalysisComplete",
  "source": "codeflow.analysis",
  "account": "123456789012",
  "time": "2024-01-15T10:30:00Z",
  "region": "us-east-1",
  "resources": [],
  "detail": {
    "user_id": "user-123",
    "leetcode_username": "john_doe",
    "submission_count": 150,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Targets

1. **ECS Task**: Runs weakness analysis worker
2. **SQS Queue**: Queues event for retry/backup processing

## Auto-Scaling

### Current Implementation

The current implementation uses EventBridge to trigger ECS tasks on-demand. Each event triggers a single task.

### Future Enhancement: SQS-Based Auto-Scaling

For production workloads, consider implementing SQS-based auto-scaling:

1. **Create ECS Service** (instead of standalone tasks)
2. **Configure Service Auto-Scaling**:
   - Minimum tasks: 0
   - Maximum tasks: 10
   - Target metric: SQS `ApproximateNumberOfMessagesVisible`
   - Scale-up threshold: > 5 messages
   - Scale-down threshold: < 2 messages

3. **Update EventBridge Rule**:
   - Remove ECS task target
   - Keep only SQS target
   - ECS service polls SQS automatically

## Deployment

### Prerequisites

1. CDK stack deployed (creates ECS cluster, ECR repository, task definition)
2. Docker installed locally
3. AWS CLI configured

### Build and Push Docker Image

```bash
# Navigate to worker directory
cd ecs-workers/weakness-analysis

# Build image
docker build -t codeflow-workers:latest .

# Get ECR repository URI
ECR_REPO_URI=$(aws cloudformation describe-stacks \
  --stack-name CodeFlowInfrastructureStack-dev \
  --query "Stacks[0].Outputs[?OutputKey=='ECRRepositoryUri'].OutputValue" \
  --output text)

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_REPO_URI

# Tag and push
docker tag codeflow-workers:latest $ECR_REPO_URI:latest
docker push $ECR_REPO_URI:latest
```

### Automated Deployment

Use the provided deployment script:

```bash
# From project root
./ecs-workers/deploy.sh dev
```

### Manual Task Execution

To manually trigger a task for testing:

```bash
aws ecs run-task \
  --cluster codeflow-workers-dev \
  --task-definition codeflow-weakness-analysis-dev \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=DISABLED}"
```

## Monitoring

### CloudWatch Metrics

Key metrics to monitor:

1. **Task Count**: Number of running tasks
2. **CPU Utilization**: Average CPU usage across tasks
3. **Memory Utilization**: Average memory usage across tasks
4. **Task Launch Time**: Time to start a task
5. **Task Duration**: How long tasks run

### CloudWatch Logs

View logs in CloudWatch Logs console:
- Log Group: `/ecs/codeflow-workers-dev`
- Filter by stream prefix: `weakness-analysis`

### X-Ray Tracing

View distributed traces in X-Ray console:
- Service Map: Shows ECS → Bedrock → DynamoDB flow
- Traces: Individual request traces with timing

### CloudWatch Alarms

Recommended alarms:

1. **High CPU Usage**: CPU > 80% for 5 minutes
2. **High Memory Usage**: Memory > 80% for 5 minutes
3. **Task Failures**: Task exit code != 0
4. **Long Task Duration**: Task runs > 14 minutes (approaching timeout)

## Cost Optimization

### Current Configuration

- **CPU**: 2 vCPU = $0.04048/hour
- **Memory**: 4 GB = $0.004445/hour
- **Total**: ~$0.045/hour per task

### Optimization Strategies

1. **Scale to Zero**: Tasks only run when triggered (no idle costs)
2. **Fargate Spot**: Use Spot for non-critical workloads (70% savings)
3. **Right-Sizing**: Monitor actual CPU/memory usage and adjust
4. **Efficient Processing**: Optimize Bedrock prompts to reduce task duration
5. **LLM Caching**: Cache Bedrock responses to avoid duplicate calls

### Cost Example

Assuming 100 profile analyses per day:
- Task duration: 5 minutes average
- Tasks per day: 100
- Total hours: 100 × 5/60 = 8.33 hours
- Daily cost: 8.33 × $0.045 = $0.37
- Monthly cost: $0.37 × 30 = $11.10

## Troubleshooting

### Task Fails to Start

**Symptoms**: Task stuck in PENDING state

**Possible Causes**:
1. ECR image not found
2. IAM role permissions missing
3. VPC/subnet configuration issue
4. Security group blocking outbound traffic

**Solution**:
1. Verify ECR image exists: `aws ecr describe-images --repository-name codeflow-workers-dev`
2. Check IAM role permissions in AWS Console
3. Verify VPC has NAT Gateway for private subnets
4. Check security group allows outbound HTTPS (443)

### Task Exits with Error

**Symptoms**: Task starts but exits with non-zero code

**Possible Causes**:
1. Application error (check CloudWatch Logs)
2. Missing environment variables
3. AWS service permissions issue

**Solution**:
1. Check CloudWatch Logs for error messages
2. Verify all required environment variables are set
3. Test IAM role permissions using AWS CLI

### High Memory Usage

**Symptoms**: Task killed due to OOM (Out of Memory)

**Possible Causes**:
1. Processing too many submissions at once
2. Large Bedrock responses not garbage collected
3. Memory leak in application code

**Solution**:
1. Reduce batch size for submission processing
2. Implement pagination for large datasets
3. Profile memory usage and fix leaks
4. Increase task memory allocation

### Bedrock Throttling

**Symptoms**: Bedrock API returns throttling errors

**Possible Causes**:
1. Too many concurrent Bedrock calls
2. Account quota exceeded

**Solution**:
1. Implement exponential backoff with retries
2. Use LLM cache to reduce duplicate calls
3. Request quota increase from AWS Support

## Security Best Practices

1. **Least Privilege**: IAM roles grant only required permissions
2. **Private Subnets**: Tasks run in private subnets (no public IP)
3. **Secrets Management**: Use AWS Secrets Manager for sensitive data
4. **Image Scanning**: ECR scans images for vulnerabilities
5. **Encryption**: Data encrypted at rest (DynamoDB, S3) and in transit (TLS)
6. **Network Isolation**: Security groups restrict network access
7. **Logging**: All actions logged to CloudWatch for audit

## Future Enhancements

1. **Service-Based Auto-Scaling**: Implement ECS Service with SQS-based scaling
2. **Fargate Spot**: Use Spot instances for cost savings
3. **Multi-Region**: Deploy workers in multiple regions for lower latency
4. **Circuit Breaker**: Implement circuit breaker for Bedrock calls
5. **Batch Processing**: Process multiple events in a single task
6. **Warm Pools**: Keep warm tasks ready for faster response
7. **Custom Metrics**: Publish custom CloudWatch metrics for business KPIs

## References

- [AWS ECS Fargate Documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [EventBridge ECS Task Target](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-targets.html#targets-specifics-ecs-task)
- [ECS Task Auto-Scaling](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-auto-scaling.html)
- [Amazon Bedrock Best Practices](https://docs.aws.amazon.com/bedrock/latest/userguide/best-practices.html)
