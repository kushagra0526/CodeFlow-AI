# Lambda Functions Deployment Guide

This guide explains how to deploy Lambda functions for the CodeFlow AI platform.

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Python 3.11 installed
- Node.js 18+ installed

## Deployment Steps

### 1. Build Lambda Layer

First, build the shared dependencies layer:

```bash
cd lambda-layers/shared-dependencies
chmod +x build.sh
./build.sh
```

This will:
- Install all dependencies from `requirements.txt`
- Remove unnecessary files to reduce size
- Create `layer.zip` ready for deployment

### 2. Deploy Infrastructure

Deploy the CDK stack which includes Lambda functions:

```bash
cd infrastructure
npm install
npm run build
cdk bootstrap  # Only needed once per account/region
cdk deploy --all
```

The CDK will:
- Upload the Lambda layer to AWS
- Create all Lambda functions
- Configure IAM roles and permissions
- Set up VPC networking
- Enable X-Ray tracing
- Create CloudWatch log groups

### 3. Verify Deployment

Check that all functions are deployed:

```bash
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `codeflow-`)].FunctionName'
```

Expected output:
```json
[
  "codeflow-auth-dev",
  "codeflow-analysis-dev",
  "codeflow-recommendations-dev",
  "codeflow-chat-mentor-dev",
  "codeflow-scraping-dev"
]
```

### 4. Test Functions

Test each function using AWS CLI:

```bash
# Test Auth function
aws lambda invoke \
  --function-name codeflow-auth-dev \
  --payload '{"httpMethod":"POST","path":"/auth/register","body":"{}"}' \
  response.json

cat response.json
```

## Environment-Specific Deployments

### Development
```bash
cdk deploy --context environmentName=dev
```

### Staging
```bash
cdk deploy --context environmentName=staging
```

### Production
```bash
cdk deploy --context environmentName=prod
```

## Updating Lambda Functions

### Update Function Code

After modifying function code:

```bash
cd infrastructure
cdk deploy
```

CDK will automatically detect changes and update the functions.

### Update Lambda Layer

After modifying dependencies:

```bash
# Rebuild layer
cd lambda-layers/shared-dependencies
./build.sh

# Deploy updated stack
cd ../../infrastructure
cdk deploy
```

## Monitoring Deployment

### View CloudWatch Logs

```bash
# View logs for a specific function
aws logs tail /aws/lambda/codeflow-auth-dev --follow
```

### View X-Ray Traces

```bash
# Get trace summaries
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s)
```

### Check Function Metrics

```bash
# Get invocation count
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=codeflow-auth-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum
```

## Rollback

If deployment fails or issues are detected:

```bash
# Rollback to previous version
cdk deploy --rollback
```

Or manually update function code:

```bash
aws lambda update-function-code \
  --function-name codeflow-auth-dev \
  --zip-file fileb://previous-version.zip
```

## Troubleshooting

### Function Timeout

If functions are timing out:
1. Check CloudWatch logs for errors
2. Increase timeout in CDK stack
3. Optimize function code
4. Check VPC NAT Gateway connectivity

### Cold Start Issues

To reduce cold starts:
1. Increase memory allocation (faster CPU)
2. Use provisioned concurrency for critical functions
3. Minimize dependencies in Lambda layer
4. Keep functions warm with scheduled invocations

### Permission Errors

If functions can't access resources:
1. Check IAM role permissions in CDK stack
2. Verify VPC security group rules
3. Check resource policies (DynamoDB, S3, etc.)
4. Review CloudWatch logs for specific errors

### Layer Size Issues

If layer exceeds 250MB unzipped:
1. Remove unnecessary dependencies
2. Use slim versions of packages
3. Split into multiple layers
4. Use Lambda container images instead

## CI/CD Integration

### GitHub Actions

Example workflow:

```yaml
name: Deploy Lambda Functions

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Build Lambda Layer
        run: |
          cd lambda-layers/shared-dependencies
          chmod +x build.sh
          ./build.sh
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy CDK Stack
        run: |
          cd infrastructure
          npm install
          npm run build
          npx cdk deploy --require-approval never
```

## Cost Optimization

### Monitor Costs

```bash
# Get Lambda cost estimate
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d '1 month ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://lambda-filter.json
```

### Optimization Tips

1. **Right-size memory**: Monitor actual memory usage and adjust
2. **Optimize timeout**: Set to minimum required duration
3. **Use VPC endpoints**: Free data transfer for S3/DynamoDB
4. **Enable LLM caching**: 60% cost reduction on Bedrock calls
5. **Use reserved concurrency**: For predictable workloads

## Security Best Practices

1. **Secrets Management**: Migrate JWT_SECRET to AWS Secrets Manager
2. **Least Privilege**: Review IAM policies regularly
3. **VPC Security**: Keep functions in private subnets
4. **Encryption**: Enable encryption at rest for all data
5. **Monitoring**: Set up CloudWatch alarms for anomalies

## Next Steps

After deployment:
1. Configure API Gateway integrations (Task 1.7)
2. Set up EventBridge rules (Task 1.7)
3. Deploy ECS Fargate workers (Task 1.8)
4. Configure Bedrock Knowledge Base (Task 1.9)
5. Implement actual business logic in functions
