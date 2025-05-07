# Testing Plan for One NZ Agentic Voice PoC

## 1. Phase 1: Claude 3 Sonnet & Basic Orchestration

### 1.1 Claude 3 Sonnet Access Verification

- **Test ID**: T1.1.1
- **Description**: Verify Claude 3 Sonnet model access in AWS Bedrock
- **Type**: Manual
- **Steps**:
  1. Access AWS Bedrock console
  2. Verify model access for Claude 3 Sonnet
  3. Document Model ID and region
- **Expected Result**: Confirmed access to Claude 3 Sonnet model
- **Acceptance Criteria**: Model ID documented, access confirmed

### 1.2 TestOrchestratorLambda IAM & Functionality

- **Test ID**: T1.2.1
- **Description**: Verify IAM policy for TestOrchestratorLambda
- **Type**: Manual
- **Steps**:
  1. Review IAM policy
  2. Verify least privilege principle
  3. Check Bedrock and CloudWatch permissions
- **Expected Result**: IAM policy follows least privilege
- **Acceptance Criteria**: Only necessary permissions granted

- **Test ID**: T1.2.2
- **Description**: Test Lambda function with mock Bedrock client
- **Type**: Automated
- **Steps**:
  1. Mock AWS Bedrock SDK
  2. Test handler function
  3. Verify input/output handling
  4. Test error scenarios
- **Expected Result**: All test cases pass
- **Acceptance Criteria**: 100% test coverage for core functionality

### 1.3 End-to-End Claude Invocation

- **Test ID**: T1.3.1
- **Description**: Test actual Claude 3 Sonnet invocation
- **Type**: Manual
- **Steps**:
  1. Deploy Lambda
  2. Invoke with test event
  3. Check CloudWatch logs
- **Expected Result**: Successful Claude invocation and response
- **Acceptance Criteria**: Valid response received, no errors

## 2. Phase 2: MCP Layer Integration

### 2.1 MCPLambda Implementation

- **Test ID**: T2.1.1
- **Description**: Test MCPLambda mock data handling
- **Type**: Automated
- **Steps**:
  1. Test data retrieval for various inputs
  2. Test "data not found" scenarios
  3. Verify mock data structure
- **Expected Result**: Correct mock data returned
- **Acceptance Criteria**: All test cases pass

### 2.2 MCP-Orchestrator Integration

- **Test ID**: T2.2.1
- **Description**: Test TestOrchestratorLambda with MCP integration
- **Type**: Automated
- **Steps**:
  1. Mock MCPLambda client
  2. Test orchestrator logic for MCP calls
  3. Verify data processing
- **Expected Result**: Successful MCP integration
- **Acceptance Criteria**: Correct data flow between components

### 2.3 End-to-End Data Flow

- **Test ID**: T2.3.1
- **Description**: Test complete data flow
- **Type**: Manual
- **Steps**:
  1. Deploy both Lambdas
  2. Test with queries requiring MCP data
  3. Verify CloudWatch logs
- **Expected Result**: Successful end-to-end flow
- **Acceptance Criteria**: Data correctly fetched and used

## 3. Phase 3: Frontend Integration

### 3.1 API Gateway Setup

- **Test ID**: T3.1.1
- **Description**: Test API Gateway configuration
- **Type**: Manual
- **Steps**:
  1. Verify API Gateway setup
  2. Test endpoint integration
  3. Check security settings
- **Expected Result**: API Gateway correctly configured
- **Acceptance Criteria**: Endpoint accessible and secure

### 3.2 Frontend Implementation

- **Test ID**: T3.2.1
- **Description**: Test frontend text interaction
- **Type**: Manual
- **Steps**:
  1. Test text input
  2. Verify API calls
  3. Check response display
  4. Test error handling
- **Expected Result**: Functional text interface
- **Acceptance Criteria**: User can send/receive text

### 3.3 End-to-End Text Flow

- **Test ID**: T3.3.1
- **Description**: Test complete text-based flow
- **Type**: Manual
- **Steps**:
  1. Use frontend UI
  2. Test with MCP-triggering queries
  3. Verify response quality
- **Expected Result**: Successful end-to-end text flow
- **Acceptance Criteria**: System handles queries correctly

## 4. Phase 4: Voice Integration

### 4.1 Nova Sonic Access

- **Test ID**: T4.1.1
- **Description**: Verify Nova Sonic model access
- **Type**: Manual
- **Steps**:
  1. Check AWS Bedrock console
  2. Verify model access
  3. Document Model ID
- **Expected Result**: Confirmed Nova Sonic access
- **Acceptance Criteria**: Model ID documented, access confirmed

### 4.2 Frontend Voice Components

- **Test ID**: T4.2.1
- **Description**: Test microphone access
- **Type**: Manual
- **Steps**:
  1. Test permission handling
  2. Verify audio capture
  3. Check UI feedback
- **Expected Result**: Functional voice input
- **Acceptance Criteria**: Audio captured correctly

### 4.3 Nova Sonic Streaming

- **Test ID**: T4.3.1
- **Description**: Test bidirectional streaming
- **Type**: Manual
- **Steps**:
  1. Test stream connection
  2. Verify audio send/receive
  3. Check error handling
- **Expected Result**: Successful streaming
- **Acceptance Criteria**: Audio streamed correctly

### 4.4 End-to-End Voice Flow

- **Test ID**: T4.4.1
- **Description**: Test complete voice interaction
- **Type**: Manual
- **Steps**:
  1. Use voice interface
  2. Test with complex queries
  3. Verify response quality
- **Expected Result**: Successful voice interaction
- **Acceptance Criteria**: System handles voice queries correctly

## 5. General Testing Considerations

### 5.1 Security Testing

- **Test ID**: T5.1.1
- **Description**: Security review
- **Type**: Manual
- **Steps**:
  1. Review IAM policies
  2. Check API security
  3. Verify environment variables
- **Expected Result**: Secure implementation
- **Acceptance Criteria**: No security vulnerabilities

### 5.2 Performance Testing

- **Test ID**: T5.2.1
- **Description**: Basic performance checks
- **Type**: Manual
- **Steps**:
  1. Measure response times
  2. Check resource usage
  3. Verify scalability
- **Expected Result**: Acceptable performance
- **Acceptance Criteria**: Response times within limits

### 5.3 Documentation

- **Test ID**: T5.3.1
- **Description**: Verify documentation
- **Type**: Manual
- **Steps**:
  1. Review setup instructions
  2. Check demo scripts
  3. Verify API documentation
- **Expected Result**: Complete documentation
- **Acceptance Criteria**: Clear and accurate docs
