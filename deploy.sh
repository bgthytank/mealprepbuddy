#!/bin/bash
set -e

# MealPrepBuddy Deployment Script

ENVIRONMENT=${1:-dev}
JWT_SECRET=${JWT_SECRET_KEY:-$(openssl rand -base64 32)}

echo "Deploying MealPrepBuddy to AWS ($ENVIRONMENT environment)"

# Build backend
echo "Building backend..."
cd backend
pip3 install -r requirements.txt -t ./
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Deploy SAM stack
echo "Deploying SAM stack..."
sam build
sam deploy \
  --config-env $ENVIRONMENT \
  --parameter-overrides "JwtSecretKey=$JWT_SECRET Environment=$ENVIRONMENT" \
  --no-confirm-changeset

# Get outputs
STACK_NAME="mealprepbuddy-$ENVIRONMENT"
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" --output text)
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" --output text)

# Deploy frontend to S3
echo "Deploying frontend to S3..."
aws s3 sync frontend/dist s3://$BUCKET_NAME --delete

# Invalidate CloudFront cache
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Origins.Items[].DomainName, '$BUCKET_NAME')].Id" --output text)
if [ -n "$DISTRIBUTION_ID" ]; then
  echo "Invalidating CloudFront cache..."
  aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
fi

echo ""
echo "Deployment complete!"
echo "Application URL: $CLOUDFRONT_URL"
