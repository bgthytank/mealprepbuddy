#!/bin/bash
# Quick Deploy Script for MealPrepBuddy
# Run this after installing AWS CLI and SAM CLI and configuring credentials

set -e

echo "🚀 MealPrepBuddy Quick Deploy Script"
echo "======================================"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first:"
    echo "   curl \"https://awscli.amazonaws.com/AWSCLIV2.pkg\" -o \"/tmp/AWSCLIV2.pkg\""
    echo "   sudo installer -pkg /tmp/AWSCLIV2.pkg -target /"
    exit 1
fi

if ! command -v sam &> /dev/null; then
    echo "❌ SAM CLI not found. Please install it first:"
    echo "   brew tap aws/tap"
    echo "   brew install aws-sam-cli"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run:"
    echo "   aws configure"
    echo "   Then enter your Access Key ID, Secret Access Key, and region (us-west-2)"
    exit 1
fi

echo "✅ All prerequisites met!"
echo ""

# Get AWS account info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-west-2")

echo "📋 Deployment Details:"
echo "   Account ID: $ACCOUNT_ID"
echo "   Region: $REGION"
echo "   Environment: dev"
echo ""

read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

# Run the deployment
echo ""
echo "🔨 Starting deployment..."
./deploy.sh dev

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Access your app at the CloudFront URL shown above"
echo "   2. Create your first user (see registration endpoint)"
echo "   3. Start planning your meals!"
echo ""
