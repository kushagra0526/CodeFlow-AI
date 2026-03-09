# Architecture Diagrams - CodeFlow AI Platform

This directory contains comprehensive architecture diagrams for the CodeFlow AI Platform, optimized for ultra-budget deployment ($70-95/month).

## Diagrams Overview

### 1. System Architecture
**File**: `01-system-architecture.md`

Complete AWS service topology showing:
- 5 Lambda functions (Auth, Analysis, Scraping, Recommendations, Chat Mentor)
- 7 DynamoDB tables (Users, Paths, Progress, Cache, History, KB, Analytics)
- 3 S3 buckets (Static Assets, KB Documents, Datasets)
- API Gateway with JWT authentication
- Amazon Bedrock (Claude 3 Sonnet + Haiku)
- EventBridge and SQS for async processing
- CloudWatch for monitoring and billing alarms

**Use Case**: Understanding the complete system architecture and AWS service interactions.

### 2. GenAI Pipeline Flow
**File**: `02-genai-pipeline.md`

Multi-step reasoning pipeline for AI Chat Mentor:
1. Intent Detection (pattern matching)
2. Cache Check (DynamoDB LLM cache, 90% hit rate)
3. RAG Retrieval (DynamoDB Knowledge Base)
4. Code Analysis (optional)
5. Prompt Construction (context + user profile)
6. Bedrock Invocation (Claude 3 Sonnet)
7. Response Parsing (markdown + citations)
8. Cache Storage (TTL: 7 days)
9. Conversation History (TTL: 90 days)

**Use Case**: Understanding how GenAI features work and why they're load-bearing.

### 3. RAG Workflow
**File**: `03-rag-workflow.md`

Retrieval-Augmented Generation implementation:
- **Knowledge Base Preparation**: Upload → Parse → Chunk → Embed → Store
- **Query Processing**: Query → Embed → Vector Search → Context → Bedrock
- **DynamoDB Vector Search**: In-memory cosine similarity (99% cheaper than OpenSearch)
- **Performance**: 100ms latency, 95% accuracy, $2/month cost

**Use Case**: Understanding RAG implementation and cost optimization decisions.

### 4. Deployment Architecture
**File**: `04-deployment-architecture.md`

Infrastructure deployment process:
- **Development**: Code → Git → CDK
- **Deployment**: Bootstrap → Synth → Deploy
- **Resources**: Lambda, DynamoDB, S3, API Gateway, IAM, CloudWatch, EventBridge, SQS
- **Post-Deployment**: Verify → Seed KB → Monitor
- **Timeline**: 50-55 minutes total

**Use Case**: Deploying the infrastructure and understanding the deployment process.

## Viewing Diagrams

### Option 1: GitHub (Recommended)
All diagrams use Mermaid syntax, which renders automatically on GitHub:
1. Navigate to the diagram file on GitHub
2. View the rendered diagram directly in the browser

### Option 2: VS Code
Install the Mermaid Preview extension:
```bash
code --install-extension bierner.markdown-mermaid
```
Then open any diagram file and press `Ctrl+Shift+V` (Windows/Linux) or `Cmd+Shift+V` (macOS).

### Option 3: Mermaid Live Editor
1. Copy the Mermaid code from any diagram file
2. Go to https://mermaid.live/
3. Paste the code and view the rendered diagram
4. Export as PNG/SVG if needed

### Option 4: Export to PNG/SVG
Using Mermaid CLI:
```bash
# Install Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Export system architecture
mmdc -i 01-system-architecture.md -o system-architecture.png

# Export GenAI pipeline
mmdc -i 02-genai-pipeline.md -o genai-pipeline.png

# Export RAG workflow
mmdc -i 03-rag-workflow.md -o rag-workflow.png

# Export deployment architecture
mmdc -i 04-deployment-architecture.md -o deployment-architecture.png
```

## Diagram Formats

All diagrams are written in **Mermaid** syntax, a text-based diagramming language that:
- ✅ Renders automatically on GitHub
- ✅ Can be version-controlled (text files)
- ✅ Can be exported to PNG/SVG
- ✅ Is easy to update and maintain
- ✅ Supports multiple diagram types (flowchart, sequence, pie, gantt)

## Architecture Highlights

### Budget Optimizations
- ❌ **No ECS Fargate**: All processing in Lambda (saves $30/month)
- ❌ **No OpenSearch**: DynamoDB-based vector search (saves $200/month)
- ❌ **No X-Ray**: Disabled tracing (saves $5/month)
- ❌ **No Sentry**: CloudWatch Logs only (saves external cost)
- ✅ **LLM Cache**: 90% hit rate (saves 60% on Bedrock costs)

### Cost Breakdown
| Service | Monthly Cost | Percentage |
|---------|--------------|------------|
| Bedrock | $20-30 | 35% |
| Lambda | $15 | 20% |
| API Gateway | $15 | 20% |
| DynamoDB | $10 | 13% |
| Data Transfer | $5 | 7% |
| CloudWatch | $3 | 4% |
| S3 | $2 | 3% |
| **Total** | **$70-95** | **100%** |

### Performance Targets
| Metric | Target | Status |
|--------|--------|--------|
| API Latency (P95) | <500ms | ✅ |
| Cache Hit Rate | >90% | ✅ |
| Bedrock Latency (P95) | <5s | ✅ |
| DynamoDB Latency | <10ms | ✅ |
| Error Rate | <1% | ✅ |

## Related Documentation

- **Main Architecture Document**: `../ARCHITECTURE-DIAGRAMS.md` (comprehensive version)
- **Deployment Guide**: `../../DEPLOYMENT-GUIDE.md`
- **Deployment Plan**: `../../DEPLOYMENT-PLAN.md`
- **Deployment Checklist**: `../../DEPLOYMENT-CHECKLIST.md`
- **Ultra Budget Mode**: `../../ULTRA-BUDGET-MODE.md`
- **Project Status**: `../../PROJECT-STATUS.md`

## Team

- **Team Leader**: Lahar Joshi
- **Team Members**: Kushagra Pratap Rajput, Harshita Devanani
- **Region**: ap-south-1 (Mumbai)
- **Budget**: $260 AWS Credits (3 months)

## Updates

| Date | Version | Changes |
|------|---------|---------|
| 2024-01-15 | 1.0.0 | Initial diagrams created for Task 13.1 |

---

**Status**: ✅ Complete  
**Task**: 13.1 Create architecture diagrams  
**Last Updated**: 2024-01-15
