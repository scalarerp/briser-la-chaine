#!/bin/bash
# Upload the code for our Lambda functions directly to AWS Lambda.
# Needs a lambda IAM policy.
#
# To use the new version, you would need to update the LambdaFunctionARN with
# the new version numbers in "cloudfront.json".
set -e

readonly LAMBDA_FOLDER="$(dirname "$0")"

function upload_lambda() {
  filename=$1; lambda_function_name=$2
  zip_file="$(mktemp -t XXXXXXXX.zip)"
  zip_folder="$(mktemp -d XXXXXXXX)"
  index_path="${LAMBDA_FOLDER}/${filename}"

  rm "${zip_file}"
  cp $index_path "$zip_folder/index.js"
  cd $zip_folder
  zip -q "${zip_file}" "index.js"
  cd -
  rm -rf $zip_folder

  previous_code_sha_256="$(
    aws --region=us-east-1 lambda get-function --function-name "${lambda_function_name}" | \
    jq -r .Configuration.CodeSha256)"
  new_code_sha_256="$(aws --region=us-east-1 lambda update-function-code \
    --function-name "${lambda_function_name}" \
    --zip-file "fileb://$(realpath "${zip_file}")" | \
    jq -r .CodeSha256)"
  rm "${zip_file}"

  if [ "$previous_code_sha_256" != "$new_code_sha_256" ]; then
    function_arn="$(aws --region=us-east-1 lambda publish-version --function-name "${lambda_function_name}" | \
      jq -r .FunctionArn)"
    echo "New version of $lambda_function_name published, update cloudfront.json: $function_arn"
  else
    echo "$lambda_function_name already up to date."
  fi
}

upload_lambda opengraph_redirect.js blc-opengraph-redirect
