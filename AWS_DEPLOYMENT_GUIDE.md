# AWS Deployment Guide for MealPrepBuddy

## Prerequisites Setup

### Step 1: Create AWS Access Keys

Since you have a new AWS account, you need to create access keys:

1. **Log into AWS Console:**
   - Go to: https://console.aws.amazon.com/
   - Use your AWS account email and password

2. **Create Access Keys:**
   - Click your username (top right) → Security credentials
   - Scroll to "Access keys" section
   - Click "Create access key"
   - Choose "Command Line Interface (CLI)"
   - Check "I understand" and click Next
   - Add description: "MealPrepBuddy deployment"
   - Click "Create access key"
   - **IMPORTANT:** Download the CSV or copy both:
     - Access key ID (starts with AKIA...)
     - Secret access key (long random string)
   - **Keep these safe!** You'll need them in Step 3

### Step 2: Install AWS CLI and SAM CLI

Run these commands in Terminal:

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "/tmp/AWSCLIV2.pkg"
sudo installer -pkg /tmp/AWSCLIV2.pkg -target /

# Verify AWS CLI installation
/usr/local/bin/aws --version

# Install SAM CLI (requires Homebrew)
# First install Homebrew if not installed:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Then install SAM CLI:
brew tap aws/tap
brew install aws-sam-cli

# Verify SAM CLI installation
sam --version
```

### Step 3: Configure AWS Credentials

```bash
aws configure
```

When prompted, enter:
- **AWS Access Key ID:** [paste your access key from Step 1]
- **AWS Secret Access Key:** [paste your secret key from Step 1]
- **Default region name:** us-west-2
- **Default output format:** json

## Deployment Steps

### Option A: Automated Deployment (Recommended)

```bash
cd /path/to/mealprepbuddy

# Deploy to dev environment
./deploy.sh dev
```

The script will:
1. Build the backend
2. Build the frontend
3. Deploy all AWS resources (DynamoDB, Lambda, API Gateway, S3, CloudFront)
4. Upload frontend files to S3
5. Invalidate CloudFront cache
6. Display your application URL

### Option B: Manual Step-by-Step Deployment

```bash
cd /path/to/mealprepbuddy

# 1. Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..

# 2. Build frontend
cd frontend
npm install
npm run build
cd ..

# 3. Build SAM application
sam build

# 4. Deploy SAM application
sam deploy \
  --config-env dev \
  --parameter-overrides "JwtSecretKey=$(openssl rand -base64 32) Environment=dev" \
  --guided

# Answer the prompts:
# - Stack name: mealprepbuddy-dev
# - AWS Region: us-west-2
# - Confirm changes before deploy: N
# - Allow SAM CLI IAM role creation: Y
# - Disable rollback: N
# - Save arguments to configuration file: Y
# - SAM configuration file: samconfig.toml
# - SAM configuration environment: dev

# 5. Get outputs
STACK_NAME="mealprepbuddy-dev"
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" --output text)
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" --output text)

# 6. Deploy frontend to S3
aws s3 sync frontend/dist s3://$BUCKET_NAME --delete

# 7. Invalidate CloudFront cache
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Origins.Items[].DomainName, '$BUCKET_NAME')].Id" --output text)
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

# 8. Display URL
echo "Application URL: $CLOUDFRONT_URL"
```

## What Gets Created in AWS

The deployment creates:

1. **DynamoDB Table** - Database for storing recipes, tags, rules, and plans
2. **Lambda Function** - Backend API (FastAPI)
3. **HTTP API Gateway** - API endpoint routing
4. **S3 Bucket** - Static frontend hosting
5. **CloudFront Distribution** - CDN for global delivery
6. **IAM Roles** - Permissions for Lambda to access DynamoDB

## Cost Estimate

For a new account with <10 users:
- DynamoDB: Free tier (25 GB storage, 25 RCU/WCU)
- Lambda: Free tier (1M requests/month, 400K GB-seconds)
- API Gateway: Free tier (1M requests/month for first 12 months)
- S3: Free tier (5 GB storage, 20K GET, 2K PUT)
- CloudFront: Free tier (1 TB data transfer out, 10M requests)

**Expected cost:** $0-$2/month (mostly within free tier)

## After Deployment

### Access Your Application

1. The deployment will output a CloudFront URL like:
   ```
   https://d1234abcdef.cloudfront.net
   ```

2. Open this URL in your browser

3. You'll see the MealPrepBuddy app

### Create Your First User

The app will show a login screen. Since this is a new deployment:

1. You'll need to create a user in DynamoDB manually, OR
2. If there's a registration endpoint, use it

### Check Deployment Status

```bash
# View stack resources
aws cloudformation describe-stacks --stack-name mealprepbuddy-dev

# View CloudFront distributions
aws cloudfront list-distributions --query "DistributionList.Items[*].[Id,DomainName,Status]" --output table

# Check Lambda function
aws lambda get-function --function-name mealprepbuddy-api-dev

# View DynamoDB table
aws dynamodb describe-table --table-name mealprepbuddy-dev
```

## Troubleshooting

### Issue: "Unable to locate credentials"
**Solution:** Run `aws configure` and enter your access keys

### Issue: "sam: command not found"
**Solution:** Install SAM CLI: `brew tap aws/tap && brew install aws-sam-cli`

### Issue: "Stack already exists"
**Solution:** Either delete the existing stack or use a different environment name

### Issue: CloudFront distribution takes long to deploy
**Solution:** CloudFront distributions can take 15-20 minutes to fully deploy. Be patient.

### Issue: 403 Forbidden when accessing app
**Solution:** CloudFront cache may need invalidation. Run:
```bash
DISTRIBUTION_ID=<your-distribution-id>
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

## Updating the Application

After making code changes:

```bash
# Quick update (uses deploy script)
./deploy.sh dev

# Manual update
sam build
sam deploy --config-env dev --no-confirm-changeset
aws s3 sync frontend/dist s3://YOUR-BUCKET-NAME --delete
```

## Deleting the Deployment

To remove all AWS resources:

```bash
# Delete CloudFormation stack (removes most resources)
aws cloudformation delete-stack --stack-name mealprepbuddy-dev

# Empty and delete S3 bucket (if stack deletion fails)
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name mealprepbuddy-dev --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" --output text)
aws s3 rm s3://$BUCKET_NAME --recursive
aws s3 rb s3://$BUCKET_NAME

# Then retry stack deletion
aws cloudformation delete-stack --stack-name mealprepbuddy-dev
```

## Security Notes

1. **Never commit AWS credentials** to version control
2. **Change default passwords** - Update the user creation process to use secure passwords
3. **Enable MFA** on your AWS account
4. **Review IAM permissions** - Ensure Lambda has minimal required permissions
5. **Use HTTPS only** - CloudFront is configured for this
6. **Rotate access keys** periodically

## Next Steps

1. Set up custom domain (optional):
   - Register domain in Route 53
   - Request SSL certificate in ACM
   - Configure CloudFront to use custom domain

2. Set up monitoring:
   - Enable CloudWatch alarms
   - Set up SNS for notifications
   - Monitor Lambda errors and API Gateway metrics

3. Set up backups:
   - Enable DynamoDB point-in-time recovery
   - Set up automated backups

4. Add CI/CD:
   - Set up GitHub Actions
   - Automate deployments on push to main branch

