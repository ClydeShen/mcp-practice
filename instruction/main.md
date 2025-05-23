# One NZ Agentic Voice PoC: Key Project Definitions

## 1. Objective

- **Primary_Objective**: To develop and demonstrate a Proof of Concept (PoC) for an advanced, voice-enabled **agentic architecture** for One NZ.
- **Key_Goals**:
  1.  Showcase the technical feasibility of integrating state-of-the-art speech-to-speech AI (Amazon Nova Sonic), advanced reasoning LLMs (Claude 3 Sonnet), and dynamic data fetching (MCP) through a phased implementation.
  2.  Illustrate how such a system can enhance the new customer onboarding experience by providing intelligent assistance for common queries, initially text-based, then voice-driven.
  3.  Demonstrate the potential for improving ongoing customer service interactions through context-aware support, evolving from text to voice.
  4.  Provide a tangible example of an agentic system that can understand complex requests, orchestrate tasks, retrieve information, and deliver natural responses (textual and spoken).
  5.  Enable One NZ to evaluate the potential business value, development effort, and integration complexities of this technology for future, broader applications, based on iterative deliverables.
  6.  Ensure the PoC is easily demonstrable in a controlled environment at each phase, and its setup is well-documented.

### 1.1 Project Requirement

- The project should be easy to demo locally, with demonstrable milestones at the end of each implementation phase.
- The project should be easy to setup and initialise, with clear instructions for each phase.
- The project needs to implement LLM (Claude 3 Sonnet) and MCP as core services in early phases, with voice (Amazon Nova Sonic) integrated in a later phase.
- The project should clearly demonstrate an **Agentic Architecture**.

## 2. Technical Requirements (Core System Capabilities - Phased Implementation)

This section outlines the core technical capabilities, grouped by the planned implementation phase. The system will be built iteratively.

### Phase 1 & 2: Claude 3 Sonnet, MCP, and Orchestration Core

_(Focus: Backend reasoning, data fetching, and text-based orchestration)_

- **TR_004_Advanced_Reasoning_LLM**: The Orchestration Layer MUST use Claude 3 Sonnet on Bedrock for:
  - Deep understanding of complex user intents (received as text initially).
  - Task planning, including determining when external data is required.
  - **Formulating requests for data retrieval via MCP when necessary, using a defined format.**
  - Generating coherent, context-aware textual responses, potentially after receiving requested data.
- **TR_005_Dynamic_Data_Fetching_MCP**: The system MUST implement a Model Context Protocol (MCP) layer capable of fetching data from predefined (mock or simple for PoC) sources (e.g., databases, APIs, knowledge bases) **based on structured requests formulated by Claude 3 Sonnet and relayed/executed by the Orchestration Layer.**
- **TR_003_Complex_Query_Delegation_Text_Based**: The Orchestration Layer (e.g., Lambda) MUST be able to process complex user queries (received as text) by:
  1.  Engaging Claude 3 Sonnet with the query and relevant context.
  2.  Analyzing Claude's response to **detect potential requests for external data/actions** via a defined mechanism (e.g., specific formatted output).
  3.  If a data request is detected, invoking the MCP layer to retrieve the necessary data.
  4.  Providing the retrieved data back to Claude 3 Sonnet in a subsequent invocation.
  5.  Receiving the final, data-informed response from Claude.
- **TR_006_Context_Management_Text_Based**: The Orchestration Layer MUST maintain conversational context within a session (e.g., recent turns, key extracted information, **state of MCP requests and returned data**) to inform subsequent interactions with Claude 3 Sonnet.

### Phase 3: Basic Frontend Integration (Text-Based)

_(Focus: Connecting the backend to a user via a text interface)_

- **TR_NEW_001_Text_Frontend_Interaction**: The system MUST provide a basic web frontend (Next.js) allowing users to submit text-based queries to the Orchestration Layer (exposed via an API Gateway) and receive/display textual responses generated by Claude 3 Sonnet (potentially using data from MCP).

### Phase 4: Nova Sonic and Voice I/O Integration

_(Focus: Adding voice capabilities for input and output)_

- **TR_001_Voice_Input_Processing**: The system MUST capture streaming voice input from the user via the web frontend and utilise Amazon Nova Sonic on Bedrock for real-time Speech-to-Text (STT) conversion. The resulting transcript will be sent to the Orchestration Layer.
- **TR_002_Initial_NLU_Interaction_Handling (by Nova Sonic, if applicable and simple)**: Amazon Nova Sonic MAY provide initial Natural Language Understanding (NLU) capabilities or interaction handling for very simple conversational turns directly. However, for this PoC, the primary flow for complex queries involves passing the STT transcript to the Orchestration Layer.
- **TR_007_Voice_Output_Generation**: The system MUST use Amazon Nova Sonic on Bedrock to convert textual responses (generated by Claude 3 Sonnet and relayed by the Orchestrator) into high-quality, expressive, and prosody-aware synthesized speech, streamed back to the user via the web frontend.
- **TR_008_Bidirectional_Streaming**: Voice input from the user to Amazon Nova Sonic and voice output from Amazon Nova Sonic to the user MUST be handled via a bidirectional streaming mechanism for low latency and real-time interaction.
- **TR_003_Complex_Query_Delegation_Voice_Based**: Upon receiving a transcript from Amazon Nova Sonic (STT), the Orchestration Layer MUST process the complex user query by engaging Claude 3 Sonnet and MCP as established in earlier phases.
- **TR_006_Context_Management_Full_Voice**: The system MUST maintain conversational context from voice interactions (incorporating STT transcripts and system responses) to inform responses from both Amazon Nova Sonic (for TTS) and Claude 3 Sonnet.

### Cross-Cutting Technical Requirements (Applicable throughout all phases)

- **TR_009_Modular_Architecture_And_Code_Sharing**: The system components (Frontend, Orchestration Layer, Claude 3 Sonnet interaction logic, MCP, Nova Sonic interaction logic) SHOULD be designed with clear interfaces to promote modularity. If a monorepo is used, shared code (e.g., TypeScript types) SHOULD be managed effectively across packages.
- **TR_010_Secure_AWS_Service_Access**: All interactions with AWS services (Bedrock, Lambda, API Gateway, potential data sources) MUST use secure authentication and authorization mechanisms (IAM roles with least privilege).
- **TR_011_Efficient_Development_Workflow**: The project structure (potentially a pnpm monorepo) SHOULD support an efficient development workflow, allowing for easy management of shared dependencies, inter-package linking, and running scripts across different parts of the application (frontend, backend Lambdas).

## 3. System Prerequisites

_(These remain largely the same, but access to Nova Sonic models can be verified closer to Phase 4)_

- **SP_001_AWS_Account**: Active AWS account with appropriate billing and usage limits enabled.
- **SP_002_IAM_User_Permissions**:
  - An IAM user or role with programmatic access (Access Key ID and Secret Access Key if needed for local SDK testing, or appropriate instance/Lambda roles).
  - Necessary permissions for:
    - AWS Bedrock: `bedrock:InvokeModel` for Claude 3 Sonnet model ARN (initially), and later for Amazon Nova Sonic model ARN including any permissions required for Bedrock's bidirectional streaming API.
    - AWS Lambda: `lambda:InvokeFunction`, `lambda:CreateFunction`, `lambda:UpdateFunctionConfiguration`, etc., for deploying and managing the Orchestration and MCP Lambdas.
    - Amazon API Gateway: Permissions to create and manage API Gateway if used to expose Lambdas.
    - AWS IAM: Permissions to create and manage IAM roles and policies.
    - Amazon CloudWatch: Permissions for logging (`logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`).
    - (If used by MCP or context): DynamoDB, S3, or other data source access permissions.
- **SP_003_Bedrock_Model_Access_Enabled**: Confirmed access to Claude 3 Sonnet models within the specified AWS region in the Bedrock console (essential for early phases). Access to Amazon Nova Sonic to be confirmed before commencing Phase 4.
- **SP_004_Development_Environment**:
  - Node.js (latest LTS recommended).
  - pnpm package manager.
  - AWS CLI (latest version) configured with credentials for the IAM user/role.
  - Git for version control.
  - A modern web browser supporting microphone access (for Phase 4) and relevant web APIs (e.g., WebSockets, MediaStream).
- **SP_005_Project_Setup**:
  - An existing Next.js project initialized with TypeScript.
  - MUI library installed in the Next.js project.
  - AWS SDK for JavaScript v3 installed in the Next.js project and any backend Lambda functions.

## 4. Quality Standards (for PoC)

_(These apply throughout, with focus adapting to each phase's deliverables)_

- **QS_001_Functional_Correctness**: The PoC MUST successfully execute the predefined end-to-end user scenarios relevant to each phase, demonstrating all core technical requirements for that phase.
- **QS_002_Clarity_of_Implementation**: Code SHOULD be clean, reasonably commented, and follow basic best practices for the chosen languages/frameworks to ensure it's understandable for review and future iteration. TypeScript types should be used effectively.
- **QS_003_Demo_Readiness**: The PoC MUST be easily set up and demonstrated in a controlled environment at the end of each major phase, with clear instructions.
- **QS_004_Modularity_Demonstration**: The separation of concerns between key architectural components SHOULD be evident.
- **QS_005_Basic_Error_Handling**: The system SHOULD handle common, foreseeable errors gracefully at a PoC level for the implemented features.
- **QS_006_Voice_Interaction_Quality_PoC_Level (Applicable in Phase 4)**:
  - STT by Nova Sonic should be sufficiently accurate for PoC use cases.
  - TTS by Nova Sonic should be clear, understandable, and demonstrate expressive capabilities.
  - Latency for voice responses should be acceptable for a demonstration setting.
- **QS_007_Security_Awareness_PoC_Level**: No hardcoded secrets in client-side code or version control. IAM permissions should strive for least privilege within PoC constraints for components implemented.
- **QS_008_Documentation**: Key architectural decisions, setup instructions for each phase, and demo scripts MUST be documented.

## 5. Tech Stack (Defined for PoC)

_(The stack remains the same, implemented iteratively across phases)_

- **Monorepo_Management_Tool**: pnpm (with workspaces)
- **Frontend**: Next.js (with TypeScript), MUI, React Hooks, Browser Web APIs (MediaRecorder, getUserMedia for Phase 4)
- **Backend_Orchestration_MCP**: AWS Lambda (Node.js with TypeScript, or Python), Amazon API Gateway (optional but common for frontend trigger)
- **AI_Models_Platform**: AWS Bedrock
  - **Reasoning_LLM**: Claude 3 Sonnet (via Bedrock API - Phases 1-4)
  - **Speech_To_Speech_Model**: Amazon Nova Sonic (via Bedrock bidirectional streaming API - Phase 4)
- **Data_Storage_For_Context_MCP_Data_PoC**: JSON files, hardcoded data within Lambda, or a simple test API for MCP. Amazon DynamoDB (Optional for session context).
- **Shared_Code_Types**: TypeScript.
- **Development_Supporting_Tools**: Git, IaC (AWS SAM, CDK, or Serverless Framework), AWS SDK for JavaScript v3, Amazon CloudWatch Logs.

This revised structure should align the main project definition with the new phased implementation plan.
