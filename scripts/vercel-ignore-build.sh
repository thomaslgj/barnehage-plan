#!/bin/bash

# Exit codes:
# 0 = Skip build
# 1 = Proceed with build

echo "Checking if build should run..."

# If there's no previous SHA (first deploy), always build
if [ -z "$VERCEL_GIT_PREVIOUS_SHA" ]; then
  echo "No previous SHA, proceeding with build"
  exit 1
fi

# Check if there are changes outside of apps/mobile
git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" "$VERCEL_GIT_COMMIT_SHA" -- . ':(exclude)apps/mobile'

if [ $? -eq 0 ]; then
  echo "Only mobile app changed, skipping build"
  exit 0
else
  echo "Web app changes detected, proceeding with build"
  exit 1
fi
