# Testing Strategy for Technical Implementation Tasks: One NZ Agentic Voice PoC (Revised Phased Approach)

This document outlines the testing strategy for each technical task within the revised 4-Phase implementation plan for the One NZ Agentic Voice Proof of Concept (PoC).

## Phase 1: Setup Claude 3 Sonnet Access & Basic Orchestration

### Task 1.1: Verify Claude 3 Sonnet Model Access

- **Task_Name**: Verify Claude 3 Sonnet Model Access
- **Original_Reference**: Adapts from TECH_TASK_003
- **Technical_Objective**: Ensure the Claude 3 Sonnet model is activated and accessible within the organisation's AWS account and specified region.
- **Testing_Strategy**:
  1.  **AWS Console Verification**: Manually check in the Bedrock console that model access for Claude 3 Sonnet is granted for the account/region.
  2.  **SDK/CLI Test**: Write a minimal script (using AWS SDK or CLI) that attempts to invoke Claude 3 Sonnet with a very simple, valid prompt, using an appropriately permissioned IAM role (see Task 1.2).
- **Best_Practice_Check**: Documented `modelId` for Claude 3 Sonnet is correct. Region is confirmed.
- **Works_Properly_Indicator**: SDK/CLI script successfully invokes the model and receives a valid response (or a model-specific error for an invalid prompt, not an authentication/access error).

### Task 1.2: Define IAM & Create a `TestOrchestratorLambda` (invokes Claude)

- **Task_Name**: Define IAM & Create `TestOrchestratorLambda`
- **Original_Reference**: Combines aspects of TECH_TASK_001 (IAM), TECH_TASK_002 (IaC for Lambda), TECH_TASK_020 (Orchestration Lambda Handler), TECH_TASK_021 (Claude Invocation Logic)
- **Technical_Objective**: Create an AWS Lambda function (`TestOrchestratorLambda`) with an IAM role that grants it necessary permissions to invoke Claude 3 Sonnet and write to CloudWatch Logs.
- **Testing_Strategy**:
  1.  **IAM Policy Review (Manual)**:
      - Review the IAM policy for the `TestOrchestratorLambda` role against the principle of least privilege. Verify it only has `bedrock:InvokeModel` for the specific Claude 3 Sonnet model ARN and necessary CloudWatch Logs permissions (`logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` on its specific log group).
  2.  **IaC Linting/Validation (If IaC is used for Lambda creation)**: Use tools provided by the IaC framework (e.g., `sam validate`, `cdk synth`).
  3.  **Deployment Test (If IaC is used)**: Deploy the IaC template. Verify Lambda and IAM role are created in AWS console.
  4.  **Lambda Unit Test (TDD Approach)**:
      - Test the Lambda handler function. Mock AWS SDK calls (BedrockRuntimeClient for Claude).
      - Verify it constructs the correct `InvokeModelCommandInput` (prompt, modelId, parameters).
      - Verify it handles the (mocked) `InvokeModelCommandOutput` correctly, parsing the response. Test error paths.
  5.  **Local Invocation (e.g., `sam local invoke` or AWS console test event)**: Test the Lambda locally (if possible) or directly in the AWS console with sample event JSONs.
- **Best_Practice_Check**: IAM policy adheres to least privilege. IaC code (if used) is version controlled and modular. Lambda code is modular, dependencies injected if complex. TypeScript types used if applicable.
- **Works_Properly_Indicator**: IAM policy is correct. Unit tests pass. Lambda executes without runtime errors for valid inputs when tested in isolation.

### Task 1.3: Test Claude 3 Sonnet Invocation via `TestOrchestratorLambda`

- **Task_Name**: Test Claude 3 Sonnet Invocation via `TestOrchestratorLambda`
- **Original_Reference**: Adapts from TECH_TASK_040 (E2E component test)
- **Technical_Objective**: Confirm the deployed `TestOrchestratorLambda` can successfully invoke the actual Claude 3 Sonnet model in Bedrock.
- **Testing_Strategy**:
  1.  **Manual Invocation of Deployed Lambda**:
      - Use the AWS Lambda console's test event feature or the AWS CLI to invoke the deployed `TestOrchestratorLambda` with a sample prompt.
  2.  **Log Verification**: Check CloudWatch Logs for the `TestOrchestratorLambda` to:
      - Confirm successful invocation.
      - Verify the request sent to Claude 3 Sonnet.
      - Inspect the response received from Claude 3 Sonnet.
      - Check for any errors.
- **Works_Properly_Indicator**: `TestOrchestratorLambda` successfully invokes Claude 3 Sonnet, and the model's response is correctly logged or returned by the Lambda.

## Phase 2: Setup MCP Layer with Mock Data & Integrate with Orchestrator

### Task 2.1: Define IAM & Create `MCPLambda` with Mock Data

- **Task_Name**: Define IAM & Create `MCPLambda` with Mock Data
- **Original_Reference**: Combines aspects of TECH_TASK_001 (IAM), TECH_TASK_002 (IaC for Lambda), TECH_TASK_030 (MCP Interface), TECH_TASK_031 (Mock MCP Data Sources)
- **Technical_Objective**: Create an `MCPLambda` with an IAM role. This Lambda will receive parameters specifying required data (e.g., type, key) based on Claude's request (relayed by Orchestrator) and return corresponding mock data.
- **Testing_Strategy**:
  1.  **IAM Policy Review (Manual)**:
      - Review the IAM policy for the `MCPLambda` role. Needs CloudWatch Logs. If reading from S3, needs `s3:GetObject` for the specific S3 object/path.
  2.  **IaC/Deployment (As per Task 1.2)**: Similar validation if IaC is used.
  3.  **MCP Interface Definition (Conceptual)**: Document the expected input parameters (e.g., `{ "dataType": "customerPlanInfo", "customerId": "123" }`) and output (mock data structure) for the `MCPLambda`.
  4.  **Lambda Unit Test (TDD Approach)**:
      - Test the `MCPLambda` handler.
      - Verify correct mock data is returned for given input parameters.
      - Test error handling (e.g., requested data type or key not found in mock data).
      - If reading from S3: Mock the S3 client, test S3 object retrieval/parsing.
- **Best_Practice_Check**: IAM policy follows least privilege. Mock data structure is clear. Lambda handles parameters correctly.
- **Works_Properly_Indicator**: Unit tests pass. `MCPLambda` returns expected mock data for defined input parameters.

### Task 2.2: Integrate MCP with `TestOrchestratorLambda`

- **Task_Name**: Integrate MCP with `TestOrchestratorLambda`
- **Original_Reference**: Adapts from TECH_TASK_032 (Integrate MCP with Orchestrator) and TECH_TASK_022 (Context Management - basic form)
- **Technical_Objective**: Modify `TestOrchestratorLambda` to:
  1. Include instructions in the initial prompt to Claude on how to request external data (e.g., using a specific format like `ACTION: MCP_FETCH_...`).
  2. Parse Claude's responses to detect such action requests.
  3. If a request is detected, invoke `MCPLambda` with the appropriate parameters.
  4. Re-invoke Claude with the original context _plus_ the data returned from `MCPLambda`.
  5. Update `TestOrchestratorLambda`'s IAM role to allow invoking `MCPLambda`.
- **Testing_Strategy**:
  1.  **IAM Update Verification**:
      - Confirm `TestOrchestratorLambda`'s IAM role is updated with `lambda:InvokeFunction` permission for the `MCPLambda` ARN.
  2.  **Orchestrator Lambda Unit Test (TDD Approach for new logic)**:
      - **Mock Claude's response** to include a formatted action request (e.g., `ACTION: MCP_FETCH_PLAN_DETAILS(plan_name='XYZ')`).
      - **Verify the Orchestrator correctly parses** this action request and extracts parameters.
      - **Mock the `MCPLambda` client/invocation**.
      - **Verify the Orchestrator invokes** the (mocked) `MCPLambda` with the correctly extracted parameters.
      - **Mock the response from `MCPLambda`** (returning mock data).
      - **Verify the Orchestrator constructs the second prompt** to Claude correctly, including the initial context and the (mocked) data returned by `MCPLambda`, clearly delineated.
      - Test scenarios where Claude does _not_ request an action.
- **Best_Practice_Check**: Orchestrator correctly parses action requests. Handles `MCPLambda` invocation/response. Constructs follow-up prompts correctly. Logic for deciding when to call MCP (i.e., based _only_ on Claude's request) is sound.
- **Works_Properly_Indicator**: Unit tests for `TestOrchestratorLambda` pass, demonstrating successful parsing of action requests, mocked invocation of `MCPLambda`, and correct construction of subsequent prompts to Claude using the fetched data.

### Task 2.3: Test `TestOrchestratorLambda` -> `MCPLambda` -> Claude Flow

- **Task_Name**: Test `TestOrchestratorLambda` -> `MCPLambda` -> Claude Flow (Full Loop)
- **Original_Reference**: Adapts from TECH_TASK_040 (E2E component test)
- **Technical_Objective**: Verify the end-to-end flow where `TestOrchestratorLambda` sends a prompt to Claude, Claude requests data via a formatted action, Orchestrator calls `MCPLambda`, gets mock data, calls Claude again with the data, and receives a final response reflecting the data.
- **Testing_Strategy**:
  1.  **Manual Invocation of Deployed `TestOrchestratorLambda`**:
      - Use the AWS Lambda console's test event or AWS CLI to invoke the deployed `TestOrchestratorLambda` with a prompt designed to likely require external data (e.g., "Tell me the details for customer 123's plan").
  2.  **Log Analysis (CloudWatch)**:
      - Trace the request through `TestOrchestratorLambda` logs:
        - Verify the initial prompt sent to Claude.
        - **Verify Claude's first response includes the expected formatted action request** (e.g., `ACTION: MCP_FETCH...`).
        - **Verify the Orchestrator logs the parsed action request/parameters.**
        - Verify the Orchestrator invoked `MCPLambda` with these parameters.
        - Check `MCPLambda` logs to confirm it was invoked and returned the expected mock data.
        - **Verify the Orchestrator logs the context/data being sent back to Claude** in the second invocation.
        - Verify the second prompt sent to Claude.
        - Inspect Claude's final response to see if it appropriately used the provided mock data.
- **Works_Properly_Indicator**: Logs confirm the full multi-step invocation sequence initiated by Claude's request. Claude's final response demonstrates awareness/use of the mock data fetched via `MCPLambda`.

## Phase 3: Basic Frontend Integration (Text-Based)

### Task 3.1: Expose `TestOrchestratorLambda` via API Gateway

- **Task_Name**: Expose `TestOrchestratorLambda` via API Gateway
- **Original_Reference**: New task, implied by frontend integration.
- **Technical_Objective**: Create an Amazon API Gateway (e.g., HTTP API) that acts as a trigger for the `TestOrchestratorLambda`.
- **Testing_Strategy**:
  1.  **IaC/Deployment Verification (If IaC used)**: Confirm API Gateway and Lambda integration are correctly defined and deployed.
  2.  **API Gateway Test Feature**: Use the API Gateway console's test feature to send a sample request to the deployed endpoint.
  3.  **Log Verification**: Check `TestOrchestratorLambda`'s CloudWatch Logs to ensure it was invoked by the API Gateway test and processed the request.
  4.  **Security Configuration Review**: Check authentication/authorisation settings on the API Gateway endpoint (e.g., API key, IAM auth, or none for initial local dev).
- **Best_Practice_Check**: API Gateway configuration is correct. Endpoint is secured appropriately for the PoC stage.
- **Works_Properly_Indicator**: Test invocation from API Gateway console successfully triggers the Lambda, and the Lambda's response is returned via API Gateway.

### Task 3.2: Basic Frontend to Call Orchestrator API (Text Input & Output)

- **Task_Name**: Basic Frontend to Call Orchestrator API
- **Original_Reference**: Simplified version of frontend tasks (e.g., TECH_TASK_012 without voice)
- **Technical_Objective**: Develop a minimal web page in the Next.js frontend with a text input and a button to send the text to the `TestOrchestratorLambda` via API Gateway and display the textual response.
  - **Testing_Strategy**:
  1.  **Manual UI Test**:
      - Run the Next.js frontend locally.
      - Enter text into the input field and click the submit button.
      - Verify the request is sent to the API Gateway endpoint (check browser's network tools).
      - Verify the response from the backend is displayed on the page.
  2.  **Error Handling (Basic)**: Test how the frontend handles API call failures (e.g., network error, API Gateway error). It should display an informative message.
- **Best_Practice_Check**: Frontend code is clean. API endpoint is correctly configured (e.g., in an environment variable). Basic error handling is present.
- **Works_Properly_Indicator**: User can type a query, send it to the backend via API Gateway, and see the textual response from Claude (potentially using mock data) displayed on the page.

### Task 3.3: End-to-End Test: Frontend -> API Gateway -> `TestOrchestratorLambda` -> `MCPLambda` -> Claude

- **Task_Name**: End-to-End Test (Text-Based)
- **Original_Reference**: Adapts from TECH_TASK_040
- **Technical_Objective**: Validate the complete text-based flow from the frontend user interface to Claude 3 Sonnet, including **LLM-driven data fetching via `MCPLambda`**.
  - **Testing_Strategy**:
  1.  **Scenario-Based Manual Testing**:
      - Use the frontend UI.
      - Input a query designed to trigger the `MCPLambda` data fetching logic within the `TestOrchestratorLambda`.
      - **Test**: Observe the entire flow:
        - Frontend sends request.
        - API Gateway receives and forwards to `TestOrchestratorLambda`.
        - `TestOrchestratorLambda` invokes `MCPLambda`.
        - `MCPLambda` returns mock data.
        - `TestOrchestratorLambda` invokes Claude 3 Sonnet with prompt augmented by mock data.
        - Response is relayed back to the frontend and displayed.
  2.  **Log Analysis**: Review CloudWatch logs for API Gateway, `TestOrchestratorLambda`, and `MCPLambda` to trace the request and verify each step.
- **Works_Properly_Indicator**: The frontend displays a coherent response from Claude that correctly incorporates or reflects the mock data fetched via `MCPLambda`, based on the user's text query.

## Phase 4: Setup Nova Sonic and Voice I/O

### Task 4.1: Verify Amazon Nova Sonic Model Access

- **Task_Name**: Verify Amazon Nova Sonic Model Access
- **Original_Reference**: Adapts from TECH_TASK_003
- **Technical_Objective**: Ensure the Amazon Nova Sonic model is activated and accessible for bidirectional streaming.
  - **Testing_Strategy**:
  1.  **AWS Console Verification**: Manually check in the Bedrock console that model access for Amazon Nova Sonic is granted.
  2.  **SDK/CLI Test (Initial)**: If possible, use AWS SDK/CLI to list/describe the Nova Sonic model or perform a basic API call to confirm accessibility before attempting full streaming. The exact API for bidirectional streaming needs to be identified.
- **Best_Practice_Check**: Documented `modelId` for Nova Sonic is correct.
- **Works_Properly_Indicator**: Able to confirm model availability and access permissions.

### Task 4.2: Define IAM for Frontend/Nova Sonic Interaction

- **Task_Name**: Define IAM for Frontend/Nova Sonic Interaction
- **Original_Reference**: Adapts from TECH_TASK_001
- **Technical_Objective**: Define IAM permissions for the entity (e.g., frontend's backend, or Cognito Identity Pool role) that will establish the bidirectional stream with Nova Sonic.
- **Testing_Strategy**:
  1.  **IAM Policy Review**:
      - Verify the policy grants the necessary action for Bedrock bidirectional streaming (e.g., `bedrock:InvokeModelWithResponseStream` - _action name to be confirmed_) specifically for the Nova Sonic model ARN.
- **Best_Practice_Check**: Policy follows least privilege.
- **Works_Properly_Indicator**: IAM Policy correctly defined.

### Task 4.3: Implement Frontend Microphone Access & Audio Capture

- **Task_Name**: Implement Frontend Microphone Access & Audio Capture
- **Original_Reference**: TECH_TASK_010
- **Technical_Objective**: Enable the frontend to request microphone access, capture audio, and prepare it for streaming.
  - **Testing_Strategy**:
    1.  **Manual UI Test**:
        - Open the frontend in a browser.
    - Trigger microphone access. Verify browser prompts for permission.
    - Grant permission: Verify UI indicates listening state.
      - Deny permission: Verify UI handles this gracefully (e.g., shows an informative message).
  2.  **Console Logging**: Log information about captured audio format (for debugging).
- **Best_Practice_Check**: Uses modern browser APIs. Clear user feedback.
- **Works_Properly_Indicator**: User can grant/deny microphone permission. Audio is captured when permission is granted.

### Task 4.4: Implement Bidirectional Streaming Client for Nova Sonic

- **Task_Name**: Implement Bidirectional Streaming Client for Amazon Nova Sonic
- **Original_Reference**: TECH_TASK_011
- **Technical_Objective**: Implement frontend logic to establish and manage a bidirectional audio stream with the Amazon Nova Sonic Bedrock endpoint.

  - **Testing_Strategy**:

  1.  **Initial Connection Test**: Verify the stream connects successfully to Nova Sonic. Log status.
  2.  **Simple Audio Send/Receive Test ("Echo" or Greeting)**:

      - Send a short audio stream (e.g., "Hello").
      - Verify Nova Sonic receives it, performs STT, and sends back a synthesized audio response (TTS of the transcript or a simple greeting).
      - Frontend should play this received audio.

  3.  **Error Handling Tests**: Simulate network errors. Verify graceful error handling.
  4.  **Stream Closure Test**: Ensure clean stream closure.

- **Best_Practice_Check**: Adherence to AWS SDK for Bedrock streaming. Robust error handling.
- **Works_Properly_Indicator**: Basic voice "conversation" (send audio, receive STT and then TTS audio) with Nova Sonic is possible.

### Task 4.5: Integrate Nova Sonic Stream with Orchestrator API for Full Voice Loop

- **Task_Name**: Integrate Nova Sonic Stream with Orchestrator API for Full Voice Loop
- **Original_Reference**: Combines TECH_TASK_013 (Frontend Signal Orchestrator - modified) and TECH_TASK_023 (Interface to Nova Sonic for TTS - now handled by frontend)
- **Technical_Objective**: Modify the frontend to:
  1. Send the transcript from Nova Sonic (STT result) to the `TestOrchestratorLambda` via the existing API Gateway.
  2. Receive the textual response from `TestOrchestratorLambda`.
  3. Send this textual response to Nova Sonic over the established bidirectional stream for TTS.
  4. Play the synthesized audio from Nova Sonic.
- **Testing_Strategy**:
  1.  **Component Integration Test**:
      - After Nova Sonic STT, verify the transcript is correctly sent to API Gateway.
      - Verify the text response from API Gateway (from `TestOrchestratorLambda`) is received by the frontend.
      - Verify this text is correctly sent to Nova Sonic for TTS.
      - Verify the resulting audio is played.
  2.  **Log Analysis**: Check frontend console logs, API Gateway logs, and `TestOrchestratorLambda` logs to trace the flow.
- **Best_Practice_Check**: Data flow is correct. Error handling between components.
- **Works_Properly_Indicator**: Frontend can take voice input, get STT, send STT to orchestrator, get text response, send text to Nova Sonic for TTS, and play audio.

### Task 4.6: Develop Basic Chat UI for Voice Interaction

- **Task_Name**: Develop Basic Chat UI for Voice Interaction
- **Original_Reference**: TECH_TASK_012
- **Technical_Objective**: Enhance the frontend UI to support voice interaction (e.g., microphone button, transcript display, agent speaking indicator).
  - **Testing_Strategy**:
    1.  **Manual UI Test**:
    - Interact with UI elements (mic button, visual feedback).
    - Verify UI updates correctly based on state (listening, processing, speaking from Nova Sonic).
    - Verify STT transcript and TTS responses (if displayed as text too) appear correctly.
- **Best_Practice_Check**: UI is intuitive for voice. MUI components used effectively.
- **Works_Properly_Indicator**: UI accurately reflects the state of voice interaction.

### Task 4.7: End-to-End Voice Test

- **Task_Name**: End-to-End Voice Test
- **Original_Reference**: TECH_TASK_040 (E2E Flow for Voice)
- **Technical_Objective**: Validate the complete voice-enabled flow from user speaking to receiving a synthesized spoken response, including orchestration and **LLM-driven MCP data fetching**.
  - **Testing_Strategy**:
    1.  **Scenario-Based Manual Testing**:
    - Use predefined PoC use case scripts (voice versions).
      - Execute each script through the frontend voice interface.
    - **Test**: Observe the entire flow:
      - Voice input -> Nova Sonic STT -> Transcript to Orchestrator -> Orchestrator (-> MCP if needed -> Claude) -> Text response to Frontend -> Text to Nova Sonic TTS -> Synthesized audio output.
      - Verify context is maintained for follow-up voice questions.
  2.  **Log Analysis**: Full trace through CloudWatch and browser console.
- **Works_Properly_Indicator**: PoC voice use cases are successfully completed. Response is relevant, timely, and uses MCP data where appropriate.

## General PoC Considerations (Adapted from original Phase 5)

- **Logging and Monitoring (TECH_TASK_041)**: Throughout all phases, ensure basic logging is implemented in Lambdas and frontend for debugging. Verify logs in CloudWatch (for backend) and browser console (for frontend).
- **PoC Demo Script and Setup Instructions (TECH_TASK_042)**: As development progresses, continuously update setup instructions and prepare demo scripts. Test these by having another team member dry run the setup and demo.
- **Security Review - PoC Context (TECH_TASK_043)**:
  - No hardcoded secrets in client-side code or version control.
  - IAM roles follow least privilege for PoC scope.
  - Sensitive configuration via environment variables or IaC parameters.
  - Review any public-facing API Gateway endpoints for basic security.

This revised testing strategy should align with the new development flow.
