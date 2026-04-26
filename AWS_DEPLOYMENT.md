# AWS Deployment Architecture for CodeAura

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CloudFront CDN                               │
│              (Global Content Distribution)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────────────────────────────────────────────┐
│                   Application Load Balancer (ALB)              │
│                      (Port 80, 443)                            │
└────────┬──────────────────────────────────┬────────────────────┘
         │                                  │
    ┌────────────────┐            ┌────────────────┐
    │   EC2 Auto     │            │   EC2 Auto     │
    │  Scaling       │   ...      │  Scaling       │
    │   Instance 1   │            │   Instance N   │
    │ (FastAPI)      │            │ (FastAPI)      │
    └────────────────┘            └────────────────┘
         │                              │
    ┌────┴──────────────────────────────┴──────┐
    │                                           │
    │  VPC (Virtual Private Cloud)             │
    │  10.0.0.0/16                            │
    │                                          │
    │  ┌──────────────────────────────────┐   │
    │  │  RDS PostgreSQL Database         │   │
    │  │  - Multi-AZ deployment           │   │
    │  │  - Automated backups             │   │
    │  │  - Read replicas                 │   │
    │  └──────────────────────────────────┘   │
    │                                          │
    │  ┌──────────────────────────────────┐   │
    │  │  ElastiCache Redis Cluster       │   │
    │  │  - In-memory caching             │   │
    │  │  - Session management            │   │
    │  └──────────────────────────────────┘   │
    │                                          │
    │  ┌──────────────────────────────────┐   │
    │  │  S3 Bucket                       │   │
    │  │  - Store code files              │   │
    │  │  - Store analysis reports        │   │
    │  └──────────────────────────────────┘   │
    │                                          │
    └──────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│              CloudWatch Monitoring & Logs                        │
│  - Application logs                                              │
│  - Performance metrics                                           │
│  - Alerts & notifications                                        │
└──────────────────────────────────────────────────────────────────┘
```

## 📋 Detailed Services

### 1. **EC2 Instances (Application Servers)**

**Specifications:**
- **Instance Type:** `t3.medium` (production) or `t3.small` (staging)
- **OS:** Amazon Linux 2 or Ubuntu 22.04
- **Auto Scaling:** 2-10 instances based on CPU/Memory
- **Load Balancing:** Application Load Balancer (ALB)

**Setup Script:**
```bash
#!/bin/bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install docker -y
sudo systemctl start docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
cd /app
git clone https://github.com/CoderAnush/CodeAura.git
cd CodeAura

# Create .env file from Secrets Manager
aws secretsmanager get-secret-value --secret-id codeaura/env --query SecretString --output text > .env

# Start services
docker-compose up -d
```

---

### 2. **RDS PostgreSQL Database**

**Configuration:**
- **Engine:** PostgreSQL 15
- **Instance Class:** `db.t3.small` (production)
- **Storage:** 100GB, 20GB auto-scaling
- **Backup Retention:** 30 days
- **Multi-AZ:** Yes (automatic failover)
- **Encryption:** AES-256 at rest
- **Parameter Group:** Custom for connection pooling

**Connection:**
```python
DATABASE_URL = "postgresql://admin:password@codeaura-db.xxxxx.rds.amazonaws.com:5432/codeaura"
```

**Security:**
- Security Group: Allow inbound on port 5432 from EC2 only
- VPC: Private subnet (no direct internet access)
- Encryption: Enabled at rest and in transit

---

### 3. **ElastiCache Redis Cluster**

**Configuration:**
- **Engine:** Redis 7
- **Node Type:** `cache.t3.micro` (production)
- **Number of Nodes:** 3 (Multi-AZ)
- **Parameter Group:** Default + custom timeouts

**Connection:**
```python
REDIS_URL = "redis://codeaura-cache.xxxxx.ng.0001.use1.cache.amazonaws.com:6379/0"
```

**Use Cases:**
- Cache analysis results (24 hours)
- Session management
- Rate limiting
- Job queues (Celery)

---

### 4. **S3 Bucket (Object Storage)**

**Bucket:** `codeaura-storage-prod`

**Use Cases:**
- Store uploaded code files
- Store generated reports
- Store analysis exports

**Lifecycle Policy:**
```json
{
  "Rules": [
    {
      "Id": "DeleteOldAnalyses",
      "Status": "Enabled",
      "Expiration": { "Days": 90 },
      "Filter": { "Prefix": "analyses/" }
    }
  ]
}
```

**Access:**
- Private bucket
- Access via IAM role on EC2
- Pre-signed URLs for downloads

---

### 5. **CloudWatch Monitoring**

**Metrics to Track:**

```python
# Application Metrics
- API response time (avg, p95, p99)
- Request count per minute
- Error rate (4xx, 5xx)
- Database connection pool usage
- Cache hit rate
- Celery task queue depth

# Infrastructure Metrics
- CPU utilization
- Memory usage
- Network I/O
- Disk space
- RDS connections
- RDS query performance
```

**CloudWatch Dashboard:**
```bash
# Create via AWS CLI
aws cloudwatch put-dashboard \
  --dashboard-name CodeAura-Production \
  --dashboard-body file://dashboard.json
```

**Alarms:**
```python
# High error rate (>5% of requests)
# CPU > 80% for 5 minutes
# Memory > 85%
# Database connections > 80
# Cache evictions > threshold
```

---

## 🚀 Deployment Steps

### Step 1: Prepare AWS Account

```bash
# Create VPC, subnets, security groups
aws ec2 create-vpc --cidr-block 10.0.0.0/16
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-security-group --group-name codeaura-app --vpc-id vpc-xxx

# Create IAM role for EC2
aws iam create-role --role-name CodeAuraEC2Role \
  --assume-role-policy-document file://trust-policy.json
```

### Step 2: Create RDS Database

```bash
aws rds create-db-instance \
  --db-instance-identifier codeaura-db \
  --db-instance-class db.t3.small \
  --engine postgres \
  --engine-version 15.2 \
  --master-username admin \
  --master-user-password 'SecurePassword123!' \
  --allocated-storage 100 \
  --db-name codeaura \
  --multi-az
```

### Step 3: Create ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id codeaura-cache \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1
```

### Step 4: Create S3 Bucket

```bash
aws s3 mb s3://codeaura-storage-prod --region us-east-1
aws s3api put-bucket-versioning \
  --bucket codeaura-storage-prod \
  --versioning-configuration Status=Enabled
```

### Step 5: Launch EC2 Instances

```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name codeaura-key \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --user-data file://setup-script.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=CodeAura-App-1}]' \
  --iam-instance-profile Name=CodeAuraEC2Role
```

### Step 6: Configure ALB

```bash
aws elbv2 create-load-balancer \
  --name codeaura-alb \
  --subnets subnet-1 subnet-2 \
  --security-groups sg-xxxxxxxxx

aws elbv2 create-target-group \
  --name codeaura-targets \
  --protocol HTTP \
  --port 8000 \
  --vpc-id vpc-xxxxxxxxx
```

---

## 💰 Cost Estimation

| Service | Instance | Monthly Cost |
|---------|----------|--------------|
| EC2 | 2x t3.medium | ~$30 |
| RDS | 1x db.t3.small (Multi-AZ) | ~$80 |
| ElastiCache | 1x cache.t3.micro | ~$20 |
| S3 | 100GB storage + 1M requests | ~$5 |
| CloudFront | ~10GB/month | ~$1 |
| Data Transfer | ~50GB/month | ~$5 |
| **Total** | | ~**$141/month** |

---

## 🔒 Security Hardening

### Network Security
```bash
# Security Group Rules
- Inbound: Port 80 (HTTP) from anywhere
- Inbound: Port 443 (HTTPS) from anywhere
- Inbound: Port 22 (SSH) from admin IP only
- Outbound: All (to allow updates)

- RDS: Port 5432 from EC2 security group only
- Redis: Port 6379 from EC2 security group only
```

### Data Protection
```bash
# Encryption at Rest
- RDS: Enable AES-256 encryption
- S3: Enable server-side encryption (SSE-S3)
- Redis: Enable encryption at rest

# Encryption in Transit
- RDS: Require SSL/TLS
- Redis: In-transit encryption
- ALB: SSL/TLS certificates (ACM)
```

### Application Security
```bash
# Environment Variables (AWS Secrets Manager)
aws secretsmanager create-secret \
  --name codeaura/env \
  --secret-string file://secrets.json
```

---

## 📊 Scaling Strategy

### Auto Scaling Policy

```json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ASGAverageCPUUtilization"
  },
  "ScaleOutCooldown": 300,
  "ScaleInCooldown": 600
}
```

### Scaling Rules
- **Scale Out:** CPU > 70% or Memory > 80%
- **Scale In:** CPU < 30% for 10 minutes
- **Min Instances:** 2
- **Max Instances:** 10

---

## 🔄 CI/CD Integration

See `.github/workflows/ci-cd.yml` for automated deployment on push to main branch.

```
git push → GitHub Actions → Tests → Build → Deploy to AWS EC2
```

---

## 📝 Terraform Code

To automate all of the above, see `terraform/` directory for complete IaC.

---

## 🆘 Troubleshooting

**Problem:** EC2 instance can't connect to RDS
```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxx

# Test connection
ssh ec2-user@instance-ip
psql -h database-endpoint.rds.amazonaws.com -U admin -d codeaura
```

**Problem:** High latency
```bash
# Check RDS metrics in CloudWatch
# Check ElastiCache hit rate
# Consider upgrading instance types
```

**Problem:** High costs
```bash
# Use AWS Cost Explorer
# Right-size instances
# Use reserved instances for 30% savings
```

---

## ✅ Production Checklist

- [ ] SSL/TLS certificates configured
- [ ] Multi-AZ enabled for RDS
- [ ] Automated backups enabled
- [ ] CloudWatch alarms configured
- [ ] SNS notifications set up
- [ ] Database credentials in Secrets Manager
- [ ] S3 bucket versioning enabled
- [ ] CloudFront cache configured
- [ ] WAF rules applied to ALB
- [ ] VPC Flow Logs enabled
- [ ] CloudTrail logging enabled
- [ ] Load testing completed (1000+ RPS)

