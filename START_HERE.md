# 🚀 MealPrepBuddy AWS Deployment - START HERE

## Quick Start (5 Steps)

### ⚠️ Important Note
I cannot use your AWS console login credentials (email/password) directly for deployment. You need to create **API access keys** first.

---

## Step 1: Install Required Tools (5 minutes)

Open Terminal and run:

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "/tmp/AWSCLIV2.pkg"
sudo installer -pkg /tmp/AWSCLIV2.pkg -target /

# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install SAM CLI
brew tap aws/tap
brew install aws-sam-cli

# Verify installations
aws --version
sam --version
```

---

## Step 2: Create AWS Access Keys (3 minutes)

1. **Open AWS Console in your browser:**
   ```
   https://console.aws.amazon.com/
   ```

2. **Login with your AWS credentials:**
   - Use your AWS account email and password

3. **Navigate to Security Credentials:**
   - Click your username in top-right corner
   - Select "Security credentials"

4. **Create Access Keys:**
   - Scroll down to "Access keys" section
   - Click "Create access key"
   - Select "Command Line Interface (CLI)"
   - Check "I understand the above recommendation"
   - Click "Next"
   - Optional: Add description "MealPrepBuddy CLI"
   - Click "Create access key"

5. **SAVE YOUR KEYS:**
   - You'll see two values:
     - **Access key ID** (looks like: AKIAIOSFODNN7EXAMPLE)
     - **Secret access key** (looks like: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY)
   - **⚠️ IMPORTANT:** Save these somewhere safe! You won't be able to see the secret key again.
   - Click "Download .csv file" to save them

---

## Step 3: Configure AWS CLI (1 minute)

In Terminal, run:

```bash
aws configure
```

When prompted, enter:
- **AWS Access Key ID:** [Paste the access key ID from Step 2]
- **AWS Secret Access Key:** [Paste the secret access key from Step 2]
- **Default region name:** us-west-2
- **Default output format:** json

Test it works:
```bash
aws sts get-caller-identity
```

You should see your AWS account ID.

---

## Step 4: Deploy to AWS (10-20 minutes)

```bash
cd /path/to/mealprepbuddy
./quick-deploy.sh
```

Or manually:
```bash
cd /path/to/mealprepbuddy
./deploy.sh dev
```

**What happens during deployment:**
1. Builds backend Python code
2. Builds frontend React app
3. Creates DynamoDB table
4. Creates Lambda function
5. Creates API Gateway
6. Creates S3 bucket for frontend
7. Creates CloudFront CDN distribution
8. Uploads frontend files
9. Displays your app URL

**⏱️ Deployment time:** 15-20 minutes (CloudFront is slow)

---

## Step 5: Access Your App

After deployment completes, you'll see:

```
Application URL: https://d1234abcdefg.cloudfront.net
```

1. **Open this URL in your browser**
2. **You'll see the MealPrepBuddy login screen**

---

## Creating Your First User

The app requires authentication, but the database is empty. You have two options:

### Option A: Check if Registration Endpoint Exists

Try accessing:
```
https://YOUR-CLOUDFRONT-URL/register
```

If it exists, you can register a new account.

### Option B: Manually Create User in DynamoDB

```bash
# Use the AWS Console:
1. Go to DynamoDB: https://console.aws.amazon.com/dynamodb/
2. Click "Tables" → "mealprepbuddy-dev"
3. Click "Explore table items"
4. Click "Create item"
5. Add user data (see backend code for schema)
```

Or use AWS CLI to insert a test user (requires knowing the exact schema).

---

## What You'll Have After Deployment

### AWS Resources Created:
- ✅ DynamoDB table: `mealprepbuddy-dev`
- ✅ Lambda function: `mealprepbuddy-api-dev`
- ✅ API Gateway: HTTP API
- ✅ S3 bucket: `mealprepbuddy-frontend-dev-{your-account-id}`
- ✅ CloudFront distribution: Global CDN

### Access Points:
- **Frontend:** https://xxxxx.cloudfront.net (your app)
- **API:** https://xxxxx.execute-api.us-west-2.amazonaws.com/dev/api

### Cost:
- **Estimated:** $0-2/month (within free tier limits)

---

## Common Issues & Solutions

### ❌ "aws: command not found"
**Solution:** AWS CLI not installed. Go back to Step 1.

### ❌ "sam: command not found"
**Solution:** SAM CLI not installed. Run:
```bash
brew tap aws/tap && brew install aws-sam-cli
```

### ❌ "Unable to locate credentials"
**Solution:** AWS not configured. Go back to Step 3.

### ❌ "AccessDenied" errors during deployment
**Solution:** Your access keys might not have permissions. Try:
1. Go to AWS Console → IAM
2. Find your user
3. Attach policy: `AdministratorAccess` (for testing)
4. Run deployment again

### ❌ CloudFront deployment is taking forever
**Solution:** This is normal! CloudFront distributions take 15-20 minutes to deploy. Be patient.

### ❌ Can't access the app (403 Forbidden)
**Solution:** CloudFront cache needs time. Wait 5-10 minutes, then try again.

---

## Next Steps After Deployment

1. **Create your first user** (see above)
2. **Test the app:**
   - Create tags (PROTEIN, PORTION, PREP)
   - Create recipes with tags
   - Plan a week of meals
   - Create rules (constraints and reminders)
   - Export to .ics file
   - Import into Apple Calendar

3. **Optional: Set up custom domain**
   - Register domain in Route 53
   - Request SSL certificate
   - Update CloudFront distribution

4. **Optional: Enable monitoring**
   - Set up CloudWatch alarms
   - Monitor Lambda errors
   - Track API usage

---

## Need Help?

- **Detailed Guide:** See `AWS_DEPLOYMENT_GUIDE.md`
- **Troubleshooting:** Check the Troubleshooting section in the guide
- **AWS Documentation:** https://docs.aws.amazon.com/

---

## Security Reminders

1. ✅ **Never share your AWS access keys**
2. ✅ **Don't commit keys to git**
3. ✅ **Enable MFA on your AWS account**
4. ✅ **Rotate keys periodically**
5. ✅ **Review IAM permissions**

---

## Summary

```bash
# Full deployment in 4 commands:
aws configure                    # Enter your access keys
cd /path/to/mealprepbuddy
./quick-deploy.sh               # Deploy everything
# Wait 15-20 minutes...
# Access your app at the CloudFront URL!
```

Good luck! 🎉

