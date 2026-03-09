# On-Call Guide for CodeFlow AI Platform

## Overview

This guide provides on-call procedures for responding to CloudWatch alarms and production incidents. Since we're running in ultra-budget mode, we focus on CloudWatch-based monitoring only (no Sentry or X-Ray).

## On-Call Rotation

### Setup
1. Subscribe to SNS topic for alarm notifications:
   ```bash
   aws sns subscribe \
     --topic-arn arn:aws:sns:us-east-1:{account-id}:codeflow-alarms-prod \
     --protocol email \
     --notification-endpoint your-email@example.com
   ```

2. Confirm subscription via email

3. Optional: Set up Slack integration via AWS Chatbot for team notifications

### Responsibilities
- Respond to critical alarms within 15 minutes
- Investigate and resolve issues within 1 hour
- Document incidents and resolutions
- Escalate if unable to resolve

## Alarm Response Procedures

### 🚨 CRITICAL: Billing Alarms

**Alarm Names**: 
- `budget-50-percent` (Alert at $40)
- `budget-75-percent` (Alert at $60)
- `budget-90-percent` (Alert at $80)

**Severity**: CRITICAL - Budget overrun risk

**Response Time**: Immediate (within 5 minutes)

#### Investigation Steps

1. **Check current costs**:
   ```bash
   aws ce get-cost-and-usage \
     --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
     --granularity DAILY \
     --metrics BlendedCost \
     --group-by Type=SERVICE
   ```

2. **Identify cost drivers**:
   - Check Bedrock usage (should be <$30/month)
   - Check Lambda invocations (should be <1M/month)
   - Check DynamoDB read/write units
   - Check data transfer costs

3. **Review LLM cache hit rate**:
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace CodeFlow/GenAI \
     --metric-name LLMCacheHitRate \
     --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 3600 \
     --statistics Average
   ```
   - Target: >60% hit rate
   - If <60%, investigate cache misses

#### Mitigation Actions

**If at 50% budget ($40)**:
- Review and optimize high-cost services
- Increase LLM cache TTL if hit rate is low
- Reduce Lambda memory if possible

**If at 75% budget ($60)**:
- Temporarily disable non-critical features
- Reduce Bedrock model usage (switch to Haiku if using Sonnet)
- Consider rate limiting API requests

**If at 90% budget ($80)** - EMERGENCY:
1. **Disable Bedrock immediately**:
   ```bash
   # Update all GenAI Lambda functions
   for func in chat-mentor recommendations; do
     aws lambda update-function-configuration \
       --function-name $func \
       --environment Variables={DISABLE_BEDROCK=true}
   done
   ```

2. **Reduce Lambda memory**:
   ```bash
   for func in chat-mentor recommendations analysis; do
     aws lambda update-function-configuration \
       --function-name $func \
       --memory-size 128
   done
   ```

3. **Enable aggressive rate limiting**:
   - Update API Gateway throttling to 10 req/min per user

4. **Notify stakeholders** of service degradation

---

### ⚠️ HIGH: API Error Rate > 5%

**Alarm Name**: `CodeFlow-API-ErrorRate-prod`

**Severity**: HIGH - User-facing impact

**Response Time**: 15 minutes

#### Investigation Steps

1. **Check API Gateway logs**:
   ```bash
   aws logs tail /aws/apigateway/codeflow-api --follow --since 30m
   ```

2. **Check Lambda function errors**:
   ```bash
   # Check each function
   for func in auth analysis recommendations chat-mentor scraping; do
     echo "=== $func ==="
     aws logs tail /aws/lambda/$func --follow --since 30m --filter-pattern "ERROR"
   done
   ```

3. **Check error types**:
   - 4XX errors: Client-side issues (bad requests, auth failures)
   - 5XX errors: Server-side issues (Lambda errors, timeouts, DynamoDB issues)

4. **Check DynamoDB throttling**:
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/DynamoDB \
     --metric-name UserErrors \
     --dimensions Name=TableName,Value=Users \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Sum
   ```

#### Resolution Actions

**For 4XX errors**:
- Review recent API changes
- Check authentication/authorization logic
- Verify request validation rules

**For 5XX errors**:
- Check Lambda function logs for exceptions
- Verify Lambda has sufficient memory/timeout
- Check DynamoDB capacity and throttling
- Verify IAM permissions

**For DynamoDB throttling**:
- Tables are on-demand, so throttling is rare
- Check for hot partition keys
- Implement exponential backoff in code

---

### ⚠️ MEDIUM: Bedrock Latency > 10s (P95)

**Alarm Name**: `CodeFlow-Bedrock-HighLatency-prod`

**Severity**: MEDIUM - Performance degradation

**Response Time**: 30 minutes

#### Investigation Steps

1. **Check Bedrock service status**:
   - Visit AWS Service Health Dashboard
   - Check for regional issues

2. **Review recent Bedrock calls**:
   ```bash
   aws logs tail /aws/lambda/chat-mentor --follow --since 1h --filter-pattern "bedrock"
   ```

3. **Check token usage**:
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace CodeFlow/GenAI \
     --metric-name TokensUsed \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Average,Maximum
   ```

4. **Check prompt complexity**:
   - Review recent prompts in logs
   - Look for unusually long prompts or context

#### Resolution Actions

- **If service issue**: Wait for AWS to resolve, monitor status
- **If token usage high**: 
  - Reduce max_tokens in Bedrock calls
  - Optimize prompts to be more concise
  - Implement request timeouts (30s)
- **If prompt complexity high**:
  - Review and optimize prompt templates
  - Reduce context window size
  - Consider chunking large inputs

---

### ⚠️ HIGH: DynamoDB Throttling Events

**Alarm Name**: `CodeFlow-DynamoDB-Throttling-prod`

**Severity**: HIGH - Data access issues

**Response Time**: 15 minutes

#### Investigation Steps

1. **Identify throttled table**:
   ```bash
   for table in Users LearningPaths Progress LLMCache ConversationHistory; do
     echo "=== $table ==="
     aws cloudwatch get-metric-statistics \
       --namespace AWS/DynamoDB \
       --metric-name UserErrors \
       --dimensions Name=TableName,Value=$table \
       --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
       --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
       --period 300 \
       --statistics Sum
   done
   ```

2. **Check table capacity mode**:
   ```bash
   aws dynamodb describe-table --table-name Users --query 'Table.BillingModeSummary'
   ```
   - Should be "PAY_PER_REQUEST" (on-demand)

3. **Check for hot partition keys**:
   - Review access patterns in application logs
   - Look for repeated queries with same partition key

#### Resolution Actions

- **If provisioned capacity**: Switch to on-demand mode
  ```bash
  aws dynamodb update-table \
    --table-name Users \
    --billing-mode PAY_PER_REQUEST
  ```

- **If hot partition**: 
  - Review data model and partition key design
  - Implement caching for frequently accessed items
  - Add exponential backoff in application code

- **If burst traffic**:
  - Implement rate limiting at API Gateway
  - Add request queuing for non-critical operations

---

### ⚠️ MEDIUM: Lambda High Concurrency > 800

**Alarm Name**: `CodeFlow-Lambda-HighConcurrency-prod`

**Severity**: MEDIUM - Scaling issue

**Response Time**: 30 minutes

#### Investigation Steps

1. **Check concurrent executions**:
   ```bash
   for func in auth analysis recommendations chat-mentor scraping; do
     echo "=== $func ==="
     aws cloudwatch get-metric-statistics \
       --namespace AWS/Lambda \
       --metric-name ConcurrentExecutions \
       --dimensions Name=FunctionName,Value=$func \
       --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
       --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
       --period 300 \
       --statistics Maximum
   done
   ```

2. **Check for unusual traffic patterns**:
   ```bash
   aws logs tail /aws/apigateway/codeflow-api --follow --since 1h
   ```

3. **Check Lambda duration**:
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/Lambda \
     --metric-name Duration \
     --dimensions Name=FunctionName,Value=chat-mentor \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Average,Maximum
   ```

#### Resolution Actions

- **If legitimate traffic spike**:
  - Monitor and ensure Lambda scales properly
  - Check account Lambda concurrency limits
  - Consider reserved concurrency for critical functions

- **If potential abuse/DDoS**:
  - Review API Gateway access logs for suspicious IPs
  - Implement IP-based rate limiting
  - Consider AWS WAF for protection

- **If slow Lambda execution**:
  - Optimize function code
  - Increase memory allocation
  - Implement caching

---

### ℹ️ LOW: LLM Cache Hit Rate < 40%

**Alarm Name**: `CodeFlow-LLM-LowCacheHitRate-prod`

**Severity**: LOW - Cost optimization issue

**Response Time**: 1 hour

#### Investigation Steps

1. **Check current cache hit rate**:
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace CodeFlow/GenAI \
     --metric-name LLMCacheHitRate \
     --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 3600 \
     --statistics Average
   ```

2. **Review cache configuration**:
   - Check TTL setting (should be 7 days)
   - Review semantic hashing algorithm
   - Check cache size and eviction policy

3. **Analyze query patterns**:
   ```bash
   aws logs tail /aws/lambda/chat-mentor --follow --since 24h --filter-pattern "cache"
   ```

#### Resolution Actions

- **If TTL too short**: Increase to 14 days
- **If query diversity high**: 
  - Review semantic hashing to be more lenient
  - Consider query normalization
- **If cache eviction high**:
  - Review DynamoDB TTL settings
  - Consider increasing cache retention

---

## Common Issues and Solutions

### Issue: Lambda Cold Starts

**Symptoms**: High P95 latency, timeout errors

**Solutions**:
1. Increase Lambda memory (improves CPU allocation)
2. Implement Lambda warming (scheduled invocations)
3. Optimize function initialization code
4. Use Lambda layers for shared dependencies

### Issue: Bedrock Rate Limiting

**Symptoms**: 429 errors from Bedrock, throttling messages

**Solutions**:
1. Implement exponential backoff with jitter
2. Reduce request rate
3. Request quota increase from AWS Support
4. Implement request queuing

### Issue: DynamoDB Hot Partition

**Symptoms**: Throttling on specific table, uneven request distribution

**Solutions**:
1. Review partition key design
2. Add caching layer (ElastiCache or in-memory)
3. Implement write sharding for high-write tables
4. Use DynamoDB Accelerator (DAX) if budget allows

### Issue: High Data Transfer Costs

**Symptoms**: Unexpected AWS bill increase, high data transfer charges

**Solutions**:
1. Enable compression for API responses
2. Implement pagination for large result sets
3. Use CloudFront for static assets
4. Review cross-region data transfer

---

## Escalation Procedures

### Level 1: On-Call Engineer
- Respond to alarms
- Investigate and resolve common issues
- Document incidents

### Level 2: Senior Engineer
- Escalate if unable to resolve within 1 hour
- Complex issues requiring architecture changes
- Budget overrun situations

### Level 3: Engineering Manager
- Escalate for critical outages
- Budget emergency decisions
- Stakeholder communication

---

## Incident Documentation

After resolving an incident, document in the incident log:

1. **Incident Summary**:
   - Date/time
   - Alarm triggered
   - Severity
   - Duration

2. **Root Cause**:
   - What caused the issue
   - Why it wasn't caught earlier

3. **Resolution**:
   - Actions taken
   - Time to resolution

4. **Prevention**:
   - Changes to prevent recurrence
   - Monitoring improvements

**Template**:
```markdown
## Incident: [Date] - [Alarm Name]

**Severity**: [Critical/High/Medium/Low]
**Duration**: [Start time] - [End time]
**Impact**: [User-facing impact description]

### Root Cause
[Detailed explanation]

### Resolution
[Actions taken]

### Prevention
- [ ] Action item 1
- [ ] Action item 2

### Lessons Learned
[Key takeaways]
```

---

## Useful Commands

### Check CloudWatch Dashboards
```bash
# List all dashboards
aws cloudwatch list-dashboards

# Get dashboard URL
echo "https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=CodeFlow-GenAI-Performance-prod"
```

### Check Alarm States
```bash
# List all alarms
aws cloudwatch describe-alarms --query 'MetricAlarms[*].[AlarmName,StateValue]' --output table

# Get specific alarm details
aws cloudwatch describe-alarms --alarm-names CodeFlow-API-ErrorRate-prod
```

### Check Recent Logs
```bash
# API Gateway logs
aws logs tail /aws/apigateway/codeflow-api --follow --since 1h

# Lambda logs
aws logs tail /aws/lambda/chat-mentor --follow --since 1h

# Filter for errors
aws logs tail /aws/lambda/chat-mentor --follow --since 1h --filter-pattern "ERROR"
```

### Check Costs
```bash
# Daily costs for last 7 days
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=SERVICE

# Current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost
```

---

## Contact Information

**On-Call Rotation**: [Add rotation schedule]

**Escalation Contacts**:
- Level 2: [Senior Engineer contact]
- Level 3: [Engineering Manager contact]

**AWS Support**: 
- Support plan: [Basic/Developer/Business]
- Case creation: AWS Console → Support → Create Case

**Slack Channels**:
- #codeflow-alerts (alarm notifications)
- #codeflow-incidents (incident coordination)
- #codeflow-oncall (on-call discussions)

---

## References

- [CloudWatch Documentation](infrastructure/docs/CLOUDWATCH.md)
- [Ultra Budget Mode](ULTRA-BUDGET-MODE.md)
- [Deployment Guide](DEPLOYMENT-GUIDE.md)
- [AWS Service Health Dashboard](https://status.aws.amazon.com/)
