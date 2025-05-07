# List all available Claude models from Anthropic in the specified region

`aws bedrock list-foundation-models --region=ap-southeast-2 --by-provider anthropic --query "modelSummaries[*].modelId"`

# Check which IAM groups the user 'clyde.shen' belongs to

`aws iam list-groups-for-user --user-name clyde.shen`

# List all policies attached to the BedRockAccessGroup

`aws iam list-attached-group-policies --group-name BedRockAccessGroup`

# Get detailed information about the AmazonBedrockFullAccess policy

`aws iam get-policy --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess`

# Invoke Claude 3 Sonnet model through AWS Bedrock Runtime

```
aws bedrock-runtime invoke-model `
  --region ap-southeast-2 `
  --model-id anthropic.claude-3-5-sonnet-20241022-v2:0 `
  --content-type application/json `
  --accept application/json `
  --cli-binary-format raw-in-base64-out `
  --body file://D:/Repo/mcp-practice/input.json `
  output.json
```
