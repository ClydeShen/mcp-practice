# Functional Instructions: One NZ Agentic Architecture Proof of Concept (PoC)

## Section 1: Business Context Overview

- **Organization**: One NZ
- **Project**: Agentic Architecture Proof of Concept (PoC)
- **Goal**: To explore and demonstrate the viability of an advanced AI-driven agent system to enhance customer interactions for One NZ, developed through a phased approach.
- **Primary Business Drivers**:
  - Improve new customer onboarding experience (reduce friction, provide instant support) - initially via text, then voice.
  - Enhance ongoing customer service quality and efficiency - evolving from text to voice capabilities.
  - Increase customer satisfaction through intelligent, context-aware, and timely support.
  - Explore potential for 24/7 automated support for a wider range of queries.
  - Evaluate feasibility of reducing operational costs for routine customer inquiries.
  - Position One NZ as an innovator in customer service technology.
- **Target Customer Interactions**:
  - New customer onboarding phase (e.g., plan selection, service activation, initial setup queries) - to be supported by text-based interaction initially, then voice.
  - Existing customer ongoing service phase (e.g., billing questions, plan modifications, troubleshooting, new product inquiries) - to be supported by text-based interaction initially, then voice.
- **Current State (Challenges Addressed by PoC)**:
  - High volume of repetitive customer inquiries.
  - Customer demand for immediate, 24/7 support.
  - Need for consistent and accurate information delivery across all touchpoints.
  - Desire to make complex processes (like onboarding) simpler for customers.
  - Operational load on human support agents for common questions.

## Section 2: PoC Project Core Functional Requirements (Phased Implementation)

The PoC will be developed and demonstrated in phases. Functional requirements are grouped by the phase in which they are primarily addressed or achieved.

### Phase 1 & 2: Claude 3 Sonnet, MCP, and Core Backend Logic

_(Focus: Establishing backend reasoning, data fetching, and text-based orchestration)_

- **POC_FUNC_002_Delegate_To_Claude**: When a customer's request (initially text-based, received by the Orchestration Layer) requires complex reasoning or task planning, the system MUST seamlessly delegate this to Claude 3 Sonnet.

  - **Components_Responsible**: Orchestration Layer (e.g., Lambda), Claude 3 Sonnet (Bedrock).
  - **Mechanism**: The Orchestration Layer is triggered, passing necessary context (e.g., textual query, session identifiers). The Orchestration Layer invokes Claude 3 Sonnet.
  - **Acceptance_Criteria**: Based on the textual input to the Orchestrator, Claude 3 Sonnet is correctly invoked with relevant input.

- **POC_FUNC_003_Claude_Instructs_MCP**: Claude 3 Sonnet MUST be able to **request** relevant data from backend sources **by signaling its intent (e.g., via a specific output format)** to the Orchestration Layer, which then instructs the MCP layer.

  - **Components_Responsible**: Claude 3 Sonnet (Bedrock), Orchestration Layer (e.g., Lambda), MCP Layer (e.g., Lambda).
  - **Mechanism**: Claude 3 Sonnet analyzes the query and context, determines data needs, and includes a structured request in its response to the Orchestrator. The Orchestrator parses this response, identifies the request, invokes the MCP layer with appropriate parameters. MCP interfaces with defined data sources (mock/simplified for PoC).
  - **Acceptance_Criteria**: Orchestrator successfully parses Claude's data request. MCP successfully retrieves specified mock data based on parameters derived from Claude's request. Claude demonstrates ability to generate the request format when appropriate for a given query.

- **POC_FUNC_004_Claude_Formulates_Text**: Claude 3 Sonnet MUST formulate a coherent and contextually appropriate _textual_ response or piece of information based on its reasoning, **potentially occurring after receiving necessary context requested via the MCP mechanism** and provided back to it by the Orchestrator.

  - **Component_Responsible**: Claude 3 Sonnet (Bedrock), Orchestration Layer.
  - **Acceptance_Criteria**: Claude 3 Sonnet generates accurate textual output relevant to the complex query, potentially incorporating data fetched via MCP, suitable for display to a user.

- **POC_FUNC_006_Context_Awareness_Text**: The overall system (Orchestration Layer with Claude 3 Sonnet) MUST demonstrate contextual awareness within a single text-based session, incorporating information from previous turns **and any data retrieved via MCP requests within that session**.
  - **Components_Responsible**: Orchestration Layer, Claude 3 Sonnet.
  - **Mechanism**: Conversation history (textual queries, key decisions/responses, **including MCP request/response cycles**) is maintained by the Orchestration Layer and provided as context to Claude 3 Sonnet.
  - **Acceptance_Criteria**: The system correctly answers follow-up text questions that rely on information or context established earlier in the same text-based conversation, including context derived from MCP data fetches.

### Phase 3: Basic Frontend Integration (Text-Based)

_(Focus: Enabling user interaction with the backend via a text interface)_

- **POC_FUNC_NEW_001_Text_Frontend_Interaction**: The PoC system MUST allow users to submit text-based queries via a simple web frontend and receive textual responses that are generated by the backend (Claude 3 Sonnet, potentially using MCP data).

  - **Components_Responsible**: Frontend UI (Next.js), API Gateway, Orchestration Layer.
  - **Acceptance_Criteria**:
    - User can type a query into a text input field on the frontend.
    - Frontend sends the query to the Orchestration Layer via an API Gateway endpoint.
    - Frontend displays the textual response received from the Orchestration Layer.

- **POC_FUNC_007_E2E_Text_Flow**: The PoC system's core components (Frontend for text I/O, API Gateway, Orchestration Layer, Claude 3 Sonnet on Bedrock, MCP) MUST be integrated to demonstrate a complete end-to-end text-based interaction flow, including delegation for complex queries and **LLM-driven data lookup via the MCP mechanism**.
  - **Acceptance_Criteria**: A user can type a complex query via the text frontend that requires data lookup; the system processes it through all defined Phase 1-3 components, and the user receives a relevant textual answer.

### Phase 4: Nova Sonic and Voice I/O Integration

_(Focus: Adding full voice capabilities)_

- **POC_FUNC_001_Voice_With_Nova_Sonic**: The PoC system MUST allow customers to engage in a real-time, voice-based conversation via the frontend interface using Amazon Nova Sonic on Bedrock.

  - **Components_Responsible**: Frontend UI, Amazon Nova Sonic (Bedrock model via bidirectional streaming API).
  - **Acceptance_Criteria**:
    - Customer can initiate a voice session on the frontend.
    - Frontend establishes a bidirectional audio stream with the Amazon Nova Sonic Bedrock endpoint.
    - Amazon Nova Sonic converts the customer's streaming speech into text (STT).
    - The STT transcript is made available to the frontend application logic for further processing (e.g., sending to Orchestrator).

- **POC_FUNC_002_Delegate_To_Orchestrator_From_Voice**: When a customer's voice request (converted to text by Nova Sonic STT) requires complex reasoning, task planning, or external data, the system (frontend application logic) MUST seamlessly delegate this by sending the transcript to the backend Orchestration Layer (which then uses Claude 3 Sonnet and the **LLM-driven MCP mechanism** as per Phase 1&2).

  - **Components_Responsible**: Frontend application logic managing Nova Sonic stream, Orchestration Layer (e.g., Lambda), Claude 3 Sonnet (Bedrock), MCP Layer.
  - **Mechanism**: The STT transcript from Nova Sonic is sent by the frontend to the Orchestration Layer (via API Gateway). The Orchestration Layer then proceeds as defined in POC_FUNC_002_Delegate_To_Claude, POC_FUNC_003_Claude_Instructs_MCP, etc.
  - **Acceptance_Criteria**: Based on the voice interaction with Nova Sonic (resulting in a transcript), the Orchestration Layer is correctly triggered with the transcript, and Claude 3 Sonnet/MCP are invoked as needed.

- **POC_FUNC_005_Text_To_Nova_Sonic_TTS**: The textual output from Claude 3 Sonnet (generated via the Orchestration Layer) MUST be relayed back from the Orchestrator to the frontend, which then sends it to Amazon Nova Sonic (over the bidirectional stream) to be synthesized into a high-quality, expressive voice response for the customer.

  - **Components_Responsible**: Orchestration Layer, Frontend UI, Amazon Nova Sonic (Bedrock model).
  - **Mechanism**: The Orchestration Layer sends the text from Claude 3 Sonnet to the Frontend (via API Gateway). The Frontend sends this text to Amazon Nova Sonic via the established bidirectional stream. Nova Sonic performs TTS and streams the audio back to the frontend.
  - **Acceptance_Criteria**:
    - Textual output from Claude 3 Sonnet (via Orchestrator) is successfully received by the frontend.
    - Frontend successfully sends this text to Amazon Nova Sonic for TTS via the stream.
    - Amazon Nova Sonic synthesizes this text into speech, adapting prosody as per its capabilities.
    - The synthesized speech is streamed to and played by the frontend.

- **POC_FUNC_006_Context_Awareness_Voice**: The overall system MUST demonstrate contextual awareness within a single voice session, incorporating information from previous turns handled by Amazon Nova Sonic (STT) and Claude 3 Sonnet (reasoning & response generation via Orchestrator).

  - **Components_Responsible**: Frontend (managing Nova Sonic stream), Orchestration Layer, Claude 3 Sonnet.
  - **Mechanism**: Conversation history (transcripts, key decisions/responses from Orchestrator) is maintained by the Orchestration Layer and provided as context to Claude 3 Sonnet for subsequent turns. The frontend manages the continuity of the voice session with Nova Sonic.
  - **Acceptance_Criteria**: The system correctly answers follow-up voice questions that rely on information or context established earlier in the same voice conversation.

- **POC_FUNC_007_E2E_Voice_Flow**: The PoC system's core components (Frontend for voice streaming, Amazon Nova Sonic on Bedrock, API Gateway, Orchestration Layer, Claude 3 Sonnet on Bedrock, MCP) MUST be integrated to demonstrate a complete end-to-end voice interaction flow, including delegation for complex queries and **LLM-driven data lookup via the MCP mechanism**.
  - **Acceptance_Criteria**: A customer can ask a complex question via voice that requires data lookup; the system processes it through all defined components (Nova Sonic STT -> Frontend -> Orchestrator -> MCP -> Claude -> Orchestrator -> Frontend -> Nova Sonic TTS), and the customer receives a relevant, synthesized spoken answer.

### Overarching Functional Goals (Applicable to all phases)

- **POC_FUNC_008_Manageable_Use_Cases**: The PoC MUST focus on a defined, manageable set of use cases for demonstration, adaptable for text-based demos in early phases (Phase 3) and voice-based demos in the final phase (Phase 4).

  - **Scope_Limitation**: Not intended to handle all possible customer queries.
  - **Acceptance_Criteria**: The system successfully handles the predefined PoC use cases relevant to the completed phase.

- **POC_FUNC_009_Easy_Setup_Demo**: The PoC setup and demonstration MUST be relatively easy to conduct in a local or controlled development environment for each major phase's deliverable.
  - **Acceptance_Criteria**: Clear instructions exist for setting up and running the PoC demo for each phase.

## Section 3: Key Non-Functional Considerations for PoC (To be aware of, not necessarily fully implemented until relevant phase)

- **NFR_ID**: POC_NFR_001

  - **Category**: Security
  - **Consideration**: Secure handling of any credentials used to access AWS services or backend data sources. (Note: For initial PoC, simplified local credential management is acceptable with clear warnings, but production security is paramount).

- **NFR_ID**: POC_NFR_002

  - **Category**: Modularity
  - **Consideration**: Components should be designed with clear interfaces to allow for independent development and potential future replacement or upgrades.

- **NFR_ID**: POC_NFR_003

  - **Category**: Observability (Basic)
  - **Consideration**: Basic logging of interactions and component calls to aid in debugging during PoC development across all phases.

- **NFR_ID**: POC_NFR_004
  - **Category**: Voice Interaction Quality & Real-time Performance (Primarily for Phase 4)
  - **Consideration**:
    - Bidirectional Streaming: Effective implementation of the streaming API for low latency (Phase 4).
    - STT Accuracy (Nova Sonic) (Phase 4).
    - TTS Naturalness & Prosody Adaptation (Nova Sonic) (Phase 4).
    - Latency: Overall response time for simple text interactions (Phase 3), complex text interactions (Phase 3), simple voice interactions (Nova Sonic direct, if used - Phase 4), and complex voice interactions (full loop - Phase 4).

## Section 4: Assumptions for PoC

- **Assumption_1**: Amazon Nova Sonic is available on Bedrock with a documented bidirectional streaming API, and its specific `modelId` is known (relevant for Phase 4).
- **Assumption_2**: The bidirectional streaming API for Amazon Nova Sonic allows for both sending audio from the client and receiving audio to the client, as well as a mechanism for the client application to get STT results and send text for TTS (relevant for Phase 4).
- **Assumption_3**: The frontend application (Next.js/TypeScript) can implement the client-side logic for this bidirectional audio streaming to Bedrock (e.g., using WebSockets or specific AWS SDK features for this type of streaming) (relevant for Phase 4).
- **Assumption_4**: Backend data sources for MCP will initially be mocked or simplified (e.g., JSON files, a simple test database, or a single predefined API endpoint) for PoC purposes (relevant for Phase 1&2).
- **Assumption_5**: The primary focus is on demonstrating the _functional flow and intelligence_ of the agentic architecture through iterative phases, not on production-level robustness, scalability, or UI polish for this PoC.
- **Assumption_6**: The Orchestration Layer (e.g., Lambda) will be responsible for managing the state and context of the conversation, for text interactions (Phase 1-3) and extended for voice interactions (Phase 4).

## Section 5: Out of Scope for this PoC

- Full-scale integration with all One NZ production backend systems.
- Training or fine-tuning of LLMs (will use pre-trained Bedrock models like Claude 3 Sonnet and Amazon Nova Sonic).
- Advanced UI/UX design beyond basic interaction capabilities needed for text (Phase 3) and voice I/O (Phase 4).
- Production-grade performance, load testing, or auto-scaling.
- Comprehensive security hardening beyond basic best practices for development.
- Multi-language support (PoC will assume English).
- Advanced voice biometrics or speaker identification.
- Complex turn-taking management or barge-in capabilities for voice (beyond basic streaming handling) (Phase 4).
- Wake word detection (will use explicit user action to start/stop voice input) (Phase 4).
