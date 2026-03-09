# CloudWatch Dashboards and Alarms

This document describes the CloudWatch observability setup for the CodeFlow AI Platform, including dashboards for monitoring GenAI performance, API health, and user engagement, as well as alarms for critical system metrics.

## Overview

The CloudWatch setup provides comprehensive observability across three key areas:

1. **GenAI Performance**: Monitor Bedrock API latency, token usage, and LLM cache performance
2. **API Health**: Track request rates, error rates, latency, and Lambda/DynamoDB metrics
3. **User Engagement**: Measure DAU, problems solved, learning paths generated, and chat conversations

## Dashboards

### 1. GenAI Performance Dashboard

**Dashboard Name**: `CodeFlow-GenAI-Performance-{environment}`

**Purpose**: Monitor the performance and cost of GenAI services (Amazon Bedrock)

**Widgets**:

#### Bedrock API Latency
- **Metrics**: P50 (Average), P95, P99
- **Namespace**: `CodeFlow/GenAI`
- **Metric Name**: `BedrockLatency`
- **Period**: 5 minutes
- **Unit**: Milliseconds
- **Purpose**: Track Bedrock API response times to ensure acceptable performance

#### LLM Cache Performance
- **Metrics**: Cache Hit Rate, Cache Miss Rate
- **Namespace**: `CodeFlow/GenAI`
- **Metric Names**: `LLMCacheHitRate`, `LLMCacheMissRate`
- **Period**: 5 minutes
- **Unit**: Percentage (0-100)
- **Purpose**: Monitor cache effectiveness for cost optimization (target: >60% hit rate)

#### Token Usage & Cost
- **Metrics**: Total Tokens Used (left axis), Average Cost per Request (right axis)
- **Namespace**: `CodeFlow/GenAI`
- **Metric Names**: `TokensUsed`, `CostPerRequest`
- **Period**: 1 hour
- **Units**: Tokens, USD
- **Purpose**: Track token consumption and associated costs

#### Bedrock Invocations by Model
- **Metrics**: Total Invocations
- **Namespace**: `CodeFlow/GenAI`
- **Metric Name**: `BedrockInvocations`
- **Period**: 5 minutes
- **Unit**: Count
- **Purpose**: Monitor Bedrock API usage patterns

**Access**: CloudWatch Console → Dashboards → `CodeFlow-GenAI-Performance-{environment}`

---

### 2. API Health Dashboard

**Dashboard Name**: `CodeFlow-API-Health-{environment}`

**Purpose**: Monitor API Gateway, Lambda, and DynamoDB health metrics

**Widgets**:

#### API Request Rate
- **Metrics**: Total Requests
- **Source**: API Gateway metrics
- **Period**: 5 minutes
- **Unit**: Requests
- **Purpose**: Track overall API traffic

#### API Error Rate
- **Metrics**: 4XX Errors, 5XX Errors
- **Source**: API Gateway metrics
- **Period**: 5 minutes
- **Unit**: Errors
- **Purpose**: Monitor client and server errors

#### API Latency
- **Metrics**: P50 (Average), P95, P99
- **Source**: API Gateway metrics
- **Period**: 5 minutes
- **Unit**: Milliseconds
- **Purpose**: Track API response times

#### Lambda Concurrent Executions
- **Metrics**: Invocations for Auth, Analysis, Recommendations, Chat Mentor
- **Source**: Lambda metrics
- **Period**: 5 minutes
- **Unit**: Invocations
- **Purpose**: Monitor Lambda function usage

#### DynamoDB Throttling Events
- **Metrics**: User Errors for Users, Learning Paths, Progress, LLM Cache tables
- **Source**: DynamoDB metrics
- **Period**: 5 minutes
- **Unit**: Throttled Requests
- **Purpose**: Detect capacity issues

**Access**: CloudWatch Console → Dashboards → `CodeFlow-API-Health-{environment}`

---

### 3. User Engagement Dashboard

**Dashboard Name**: `CodeFlow-User-Engagement-{environment}`

**Purpose**: Track business metrics and user activity

**Widgets**:

#### Daily Active Users (DAU)
- **Metrics**: DAU
- **Namespace**: `CodeFlow/Business`
- **Metric Name**: `DailyActiveUsers`
- **Period**: 1 day
- **Unit**: Users
- **Purpose**: Track daily user engagement

#### Problems Solved per Day
- **Metrics**: Problems Solved
- **Namespace**: `CodeFlow/Business`
- **Metric Name**: `ProblemsSolved`
- **Period**: 1 day
- **Unit**: Count
- **Purpose**: Measure user productivity

#### Learning Paths Generated
- **Metrics**: Paths Generated
- **Namespace**: `CodeFlow/Business`
- **Metric Name**: `LearningPathsGenerated`
- **Period**: 1 day
- **Unit**: Count
- **Purpose**: Track learning path creation

#### Chat Mentor Conversations
- **Metrics**: Total Conversations
- **Source**: Chat Mentor Lambda invocations
- **Period**: 1 hour
- **Unit**: Count
- **Purpose**: Monitor AI mentor usage

**Access**: CloudWatch Console → Dashboards → `CodeFlow-User-Engagement-{environment}`

---

## CloudWatch Alarms

All alarms send notifications to the SNS topic: `codeflow-alarms-{environment}`

### Alarm 1: API Error Rate > 5%

**Alarm Name**: `CodeFlow-API-ErrorRate-{environment}`

**Description**: Alert when API error rate exceeds 5% for 5 minutes

**Metric**: API Gateway 5XX Errors (Sum)

**Threshold**: 10 errors in 5 minutes (assuming ~200 requests = 5%)

**Evaluation Periods**: 1

**Action**: Send notification to SNS topic

**Severity**: High

**Response**: 
- Check API Gateway logs for error details
- Review Lambda function errors
- Check DynamoDB capacity and throttling

---

### Alarm 2: Bedrock Latency > 10s (P95)

**Alarm Name**: `CodeFlow-Bedrock-HighLatency-{environment}`

**Description**: Alert when Bedrock P95 latency exceeds 10 seconds

**Metric**: `CodeFlow/GenAI` → `BedrockLatency` (p95)

**Threshold**: 10,000 milliseconds (10 seconds)

**Evaluation Periods**: 2

**Action**: Send notification to SNS topic

**Severity**: Medium

**Response**:
- Check Bedrock service status
- Review prompt complexity and token usage
- Consider implementing request timeouts
- Check for network issues

---

### Alarm 3: DynamoDB Throttling Events

**Alarm Name**: `CodeFlow-DynamoDB-Throttling-{environment}`

**Description**: Alert when DynamoDB throttling events occur

**Metric**: Sum of User Errors across Users, Learning Paths, Progress, and LLM Cache tables

**Threshold**: 5 throttling events in 5 minutes

**Evaluation Periods**: 1

**Action**: Send notification to SNS topic

**Severity**: High

**Response**:
- Review DynamoDB table capacity settings
- Consider switching to on-demand billing mode (if using provisioned)
- Check for hot partition keys
- Implement exponential backoff in application code

---

### Alarm 4: Lambda Concurrent Executions > 800

**Alarm Name**: `CodeFlow-Lambda-HighConcurrency-{environment}`

**Description**: Alert when Lambda concurrent executions exceed 800

**Metric**: Sum of invocations across Auth, Analysis, Recommendations, Chat Mentor, and Scraping functions

**Threshold**: 800 invocations per minute

**Evaluation Periods**: 2

**Action**: Send notification to SNS topic

**Severity**: Medium

**Response**:
- Check for unusual traffic patterns
- Review Lambda concurrency limits
- Consider implementing request throttling
- Check for potential DDoS or abuse

---

### Alarm 5: ECS Task Failures > 3 in 10 minutes

**Alarm Name**: `CodeFlow-ECS-TaskFailures-{environment}`

**Description**: Alert when ECS task failures exceed 3 in 10 minutes

**Metric**: `AWS/ECS` → `TasksFailed` (Sum)

**Threshold**: 3 failures in 10 minutes

**Evaluation Periods**: 1

**Action**: Send notification to SNS topic

**Severity**: High

**Response**:
- Check ECS task logs in CloudWatch
- Review task definition configuration
- Check for resource constraints (CPU, memory)
- Verify IAM permissions for task role

---

### Alarm 6: Low Cache Hit Rate < 40%

**Alarm Name**: `CodeFlow-LLM-LowCacheHitRate-{environment}`

**Description**: Alert when LLM cache hit rate falls below 40%

**Metric**: `CodeFlow/GenAI` → `LLMCacheHitRate` (Average)

**Threshold**: 40% (below this triggers alarm)

**Evaluation Periods**: 1

**Action**: Send notification to SNS topic

**Severity**: Low

**Response**:
- Review cache TTL settings (currently 7 days)
- Check for changes in user query patterns
- Consider adjusting semantic hashing algorithm
- Review cache size and eviction policies

---

## SNS Topic Configuration

**Topic Name**: `codeflow-alarms-{environment}`

**Display Name**: CodeFlow Platform Alarms

**Purpose**: Central notification hub for all CloudWatch alarms

**Subscriptions**: 
- To add email subscriptions, run:
  ```bash
  aws sns subscribe \
    --topic-arn arn:aws:sns:{region}:{account}:codeflow-alarms-{environment} \
    --protocol email \
    --notification-endpoint your-email@example.com
  ```

- To add Slack integration, use AWS Chatbot:
  1. Go to AWS Chatbot console
  2. Create a new Slack channel configuration
  3. Add the SNS topic ARN as a notification source

---

## Publishing Custom Metrics

### GenAI Metrics

To publish custom GenAI metrics from Lambda functions:

```python
import boto3
from datetime import datetime

cloudwatch = boto3.client('cloudwatch')

# Publish Bedrock latency
cloudwatch.put_metric_data(
    Namespace='CodeFlow/GenAI',
    MetricData=[
        {
            'MetricName': 'BedrockLatency',
            'Value': latency_ms,
            'Unit': 'Milliseconds',
            'Timestamp': datetime.utcnow()
        }
    ]
)

# Publish cache hit rate
cloudwatch.put_metric_data(
    Namespace='CodeFlow/GenAI',
    MetricData=[
        {
            'MetricName': 'LLMCacheHitRate',
            'Value': hit_rate_percentage,
            'Unit': 'Percent',
            'Timestamp': datetime.utcnow()
        }
    ]
)

# Publish token usage
cloudwatch.put_metric_data(
    Namespace='CodeFlow/GenAI',
    MetricData=[
        {
            'MetricName': 'TokensUsed',
            'Value': token_count,
            'Unit': 'Count',
            'Timestamp': datetime.utcnow()
        }
    ]
)
```

### Business Metrics

To publish business metrics:

```python
# Publish DAU
cloudwatch.put_metric_data(
    Namespace='CodeFlow/Business',
    MetricData=[
        {
            'MetricName': 'DailyActiveUsers',
            'Value': dau_count,
            'Unit': 'Count',
            'Timestamp': datetime.utcnow()
        }
    ]
)

# Publish problems solved
cloudwatch.put_metric_data(
    Namespace='CodeFlow/Business',
    MetricData=[
        {
            'MetricName': 'ProblemsSolved',
            'Value': problems_count,
            'Unit': 'Count',
            'Timestamp': datetime.utcnow()
        }
    ]
)

# Publish learning paths generated
cloudwatch.put_metric_data(
    Namespace='CodeFlow/Business',
    MetricData=[
        {
            'MetricName': 'LearningPathsGenerated',
            'Value': paths_count,
            'Unit': 'Count',
            'Timestamp': datetime.utcnow()
        }
    ]
)
```

---

## Accessing Dashboards

### Via AWS Console

1. Navigate to CloudWatch console
2. Click "Dashboards" in the left sidebar
3. Select one of:
   - `CodeFlow-GenAI-Performance-{environment}`
   - `CodeFlow-API-Health-{environment}`
   - `CodeFlow-User-Engagement-{environment}`

### Via CDK Outputs

After deploying the stack, the dashboard names are available in the CloudFormation outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name CodeFlowInfrastructureStack-{environment} \
  --query 'Stacks[0].Outputs[?OutputKey==`GenAIDashboardName`].OutputValue' \
  --output text
```

### Direct URLs

The CloudWatch console URLs are available in the stack outputs:
- `CloudWatchDashboardsUrl`: Direct link to dashboards list
- `CloudWatchAlarmsUrl`: Direct link to alarms list

---

## Monitoring Best Practices

### 1. Regular Review
- Review dashboards daily during initial deployment
- Set up weekly review meetings for team
- Adjust alarm thresholds based on actual usage patterns

### 2. Alarm Fatigue Prevention
- Start with conservative thresholds
- Adjust based on false positive rate
- Use composite alarms for complex conditions

### 3. Cost Optimization
- Monitor LLM cache hit rate (target: >60%)
- Track token usage trends
- Review DynamoDB capacity utilization

### 4. Performance Optimization
- Monitor P95/P99 latencies, not just averages
- Set SLOs (Service Level Objectives) for key metrics
- Use X-Ray for detailed request tracing

### 5. Incident Response
- Document runbooks for each alarm
- Set up on-call rotation
- Use SNS topic for team notifications

---

## Troubleshooting

### Dashboard Not Showing Data

**Issue**: Dashboard widgets show "No data available"

**Possible Causes**:
1. Custom metrics not being published by Lambda functions
2. Incorrect namespace or metric name
3. Time range too narrow

**Solution**:
1. Check Lambda function logs for metric publishing errors
2. Verify metric names match exactly (case-sensitive)
3. Expand time range to last 24 hours
4. Use CloudWatch Metrics explorer to verify metrics exist

---

### Alarm Not Triggering

**Issue**: Alarm stays in "Insufficient data" state

**Possible Causes**:
1. Metric not being published
2. Evaluation period too short
3. Missing data points

**Solution**:
1. Verify metric is being published regularly
2. Adjust evaluation periods
3. Change "Treat missing data" setting to "Not breaching"

---

### High Costs

**Issue**: CloudWatch costs are higher than expected

**Possible Causes**:
1. Too many custom metrics
2. High-resolution metrics (1-second granularity)
3. Long retention periods

**Solution**:
1. Consolidate metrics where possible
2. Use standard resolution (1-minute) instead of high-resolution
3. Adjust metric retention periods
4. Use metric filters instead of custom metrics where possible

---

## Cost Estimation

### CloudWatch Costs

**Dashboards**: $3/month per dashboard × 3 dashboards = **$9/month**

**Alarms**: $0.10/month per alarm × 6 alarms = **$0.60/month**

**Custom Metrics**: 
- GenAI metrics: 5 metrics × $0.30/month = $1.50/month
- Business metrics: 4 metrics × $0.30/month = $1.20/month
- Total: **$2.70/month**

**API Requests**: 
- GetMetricData: ~10,000 requests/month × $0.01/1,000 = $0.10/month
- PutMetricData: ~50,000 requests/month × $0.01/1,000 = $0.50/month
- Total: **$0.60/month**

**Total Estimated Cost**: ~**$13/month** for 10K users

---

## References

- [CloudWatch Dashboards Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Dashboards.html)
- [CloudWatch Alarms Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
- [CloudWatch Custom Metrics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/publishingMetrics.html)
- [SNS Topic Subscriptions](https://docs.aws.amazon.com/sns/latest/dg/sns-create-subscribe-endpoint-to-topic.html)
- [AWS Chatbot for Slack Integration](https://docs.aws.amazon.com/chatbot/latest/adminguide/what-is.html)
