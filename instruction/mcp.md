# Technical Document: Model Context Protocol (MCP) with AWS Bedrock & Claude Sonnet

## 1. Introduction to Model Context Protocol (MCP)

**1.1. Definition and Purpose**

Model Context Protocol (MCP), in the context of Large Language Models (LLMs) like Claude Sonnet on AWS Bedrock, refers to the **structured methods and conventions used to provide an LLM with relevant information (context) beyond the immediate user query, enabling it to generate more accurate, relevant, coherent, and personalized responses by dynamically accessing and utilizing external data or capabilities.**

The "protocol" aspect implies a defined way of:

1.  **Gathering Context**: Collecting information from various sources, including conversational history and external data systems.
2.  **Structuring Context**: Organizing this information into a format the LLM can understand and utilize effectively, primarily through prompt engineering.
3.  **Delivering Context**: Injecting this structured information into the prompt sent to the LLM.
4.  **Instructing for Action (Tool Use)**: The LLM signaling a need for external data or an action to be performed by an external system (the "MCP Layer").
5.  **Executing Actions & Retrieving Data**: An external system (MCP Layer) performing the requested action and returning results.
6.  **Integrating Action Results**: Incorporating the results from the MCP Layer back into the LLM's context for final response formulation.
7.  **Updating Context**: Persisting changes or new information derived during the interaction for future use.

**1.2. Types of Context MCP Manages in this PoC**

For this One NZ PoC, MCP will primarily manage:

- **Conversational History**: Previous turns in the dialogue.
- **System Instructions & Persona**: Guiding Claude Sonnet's behavior and defining how it interacts with the MCP Layer.
- **Data from MCP Layer (Tool Use Results)**: Information retrieved from mock One NZ data sources (e.g., plan details) based on Claude Sonnet's instructions.

**1.3. Benefits of Using MCP (for this PoC)**

- **Access to Proprietary/Dynamic Data**: Enables Claude Sonnet to answer questions about specific One NZ plans, pricing, or features (initially mocked).
- **Reduced Hallucinations**: Grounds Claude's responses in specific, provided data rather than its general knowledge.
- **Enhanced Task Capability**: Allows Claude to follow a process: understand query -> determine data need -> request data via MCP -> use data to answer.
- **Modular Design**: Decouples Claude's reasoning from the specifics of data retrieval. The MCP Layer can evolve independently.

## 2. Implementing MCP with AWS Bedrock and Claude Sonnet: The "Tool Use" Pattern

This PoC will implement MCP using a "tool use" pattern. Claude Sonnet will be instructed (via its `system` prompt) how to request specific actions from an "MCP Layer" when it needs information it doesn't possess. An Orchestration Layer (e.g., AWS Lambda) will facilitate this interaction.

**2.1. Key Bedrock API Features for MCP Implementation**

- **`InvokeModel` API Endpoint**: Used by the Orchestration Layer to call Claude Sonnet.
- **Request Body Structure (`application/json`)**:
  - `anthropic_version`: e.g., "bedrock-2023-05-31".
  - `max_tokens`: To control response length.
  - `system` (string): **Crucial for MCP**. This prompt will:
    - Define Claude Sonnet's persona (e.g., "One NZ customer service assistant").
    - Instruct Claude on _how to request an action/tool call_ when it needs external data. This involves specifying a structured format for Claude's output when it needs to signal a tool use (e.g., a specific JSON structure).
    - Explain how to use the data once it's provided back by the MCP Layer.
  - `messages` (array of message objects: `role: "user" | "assistant"`, `content: string`):
    - Carries the conversational history.
    - Used by the Orchestration Layer to provide results from MCP actions back to Claude Sonnet as if it's new information in the conversation.
  - Other generation parameters (e.g., `temperature`).

**2.2. Workflow: Orchestrator, Claude Sonnet, and MCP Layer Interaction**

The interaction is typically iterative:

1.  **User Query**: The Orchestration Layer receives the user's query (e.g., transcribed from Amazon Nova Sonic).
2.  **First Call to Claude Sonnet**:
    - **Orchestrator**: Constructs the initial prompt including:
      - The `system` prompt (with tool use instructions).
      - The `messages` array (current conversation history + new user query).
    - **Claude Sonnet**: Analyzes the query. If it can answer directly, it does. If it needs external data (as defined by the `system` prompt rules), its response will be a structured request for an MCP action (e.g., a JSON object like `{"tool_use": {"tool_name": "get_plan_features", "tool_input": {"plan_name": "XYZ"}}}`).
3.  **Orchestrator Processes Claude's Output**:
    - The Orchestrator parses Claude's response.
    - **If a `tool_use` request is detected**:
      a. The Orchestrator extracts `tool_name` and `tool_input`.
      b. It invokes the **MCP Layer** with these parameters.
4.  **MCP Layer Executes Action**:
    - The MCP Layer (e.g., a module within the Orchestrator Lambda or a separate function) looks up the `tool_name`.
    - It executes the corresponding logic (for PoC, this means retrieving data from a mock source based on `tool_input`).
    - It returns the result (e.g., plan features as a JSON object) to the Orchestrator.
5.  **Second (or subsequent) Call to Claude Sonnet**:
    - **Orchestrator**: Constructs a new prompt for Claude Sonnet. This prompt includes:
      - The original `system` prompt.
      - The _entire updated_ `messages` array, which now contains:
        1.  Original user query.
        2.  Claude's first response (the `tool_use` request itself).
        3.  A new "user" message (or a specially designated message if the model and API evolve to support `tool_results` roles explicitly) containing the data returned by the MCP Layer. This message should clearly indicate it's context from an MCP action (e.g., `{"role": "user", "content": "CONTEXT_FROM_MCP_ACTION[get_plan_features]: {actual_data_here}"}`).
    - **Claude Sonnet**: Now has the data it requested. It uses this new context to formulate the final, informed answer to the original user query.
6.  **Orchestrator Receives Final Answer**: Claude Sonnet provides a textual response.
7.  **Update & Deliver**: The Orchestrator updates the full conversation history and sends this final textual answer to the next component (e.g., to Amazon Nova Sonic for TTS).

**2.3. Example: Implementing `get_plan_features` MCP Action**

- **System Prompt Snippet for Claude**:

  ```
  "...If you need details about a specific mobile plan, you MUST request it by responding ONLY with a JSON object in the exact format:
  {\"tool_use\": {\"tool_name\": \"get_plan_features\", \"tool_input\": {\"plan_name\": \"<PLAN_NAME_HERE>\"}}}.
  After I provide the plan features, use them to answer the user."
  ```

- **User Query**: "Tell me about the One NZ Smart Plan."

- **Interaction Flow**:
  1.  **Orchestrator to Claude (Call 1)**: `messages: [{"role": "user", "content": "Tell me about the One NZ Smart Plan."}]` (plus `system` prompt).
  2.  **Claude to Orchestrator (Response 1)**: `{"tool_use": {"tool_name": "get_plan_features", "tool_input": {"plan_name": "One NZ Smart Plan"}}}` (Claude's textual content).
  3.  **Orchestrator calls MCP Layer**: `executeMcpAction("get_plan_features", {"plan_name": "One NZ Smart Plan"})`.
  4.  **MCP Layer returns to Orchestrator**: `{"features": ["10GB Data", "Unlimited Calls"], "cost": "$50"}`.
  5.  **Orchestrator to Claude (Call 2)**:
      ```json
      // messages array:
      [
        { "role": "user", "content": "Tell me about the One NZ Smart Plan." },
        {
          "role": "assistant",
          "content": "{\"tool_use\": {\"tool_name\": \"get_plan_features\", \"tool_input\": {\"plan_name\": \"One NZ Smart Plan\"}}}"
        },
        {
          "role": "user",
          "content": "CONTEXT_FROM_MCP_ACTION[get_plan_features]: {\"features\":[\"10GB Data\",\"Unlimited Calls\"],\"cost\":\"$50\"}"
        }
      ]
      ```
      (plus `system` prompt).
  6.  **Claude to Orchestrator (Response 2 - Final Answer)**: "The One NZ Smart Plan includes 10GB Data and Unlimited Calls, and costs $50 per month."

**2.4. MCP Layer Implementation (Conceptual for PoC)**

- For the PoC, the MCP Layer can be a set of functions within the Orchestrator Lambda.
- Each function maps to a `tool_name` (e.g., `handleGetPlanFeatures(toolInput)`).
- These functions return mock data based on `toolInput`.
- **Future Enhancement**: These functions could be refactored into a separate Lambda or service that calls real databases or One NZ APIs.

## 3. Key Considerations for MCP Implementation

- **Prompt Engineering**: The `system` prompt is paramount. It must clearly instruct Claude Sonnet on:
  - When to request a tool.
  - The exact format of the tool request.
  - How to use the information returned by the tool.
  - What tools are available (implicitly by the instructions, or explicitly listed).
- **Parsing Claude's Output**: The Orchestrator needs robust logic to detect and parse the structured `tool_use` requests from Claude's textual responses. This might involve JSON parsing, regular expressions, or checking `stop_reason` from Bedrock if it indicates `tool_use`.
- **Error Handling**:
  - What if the MCP Layer cannot find the data (e.g., unknown plan name)? The MCP Layer should return a clear error/status, and Claude should be instructed (via system prompt) how to respond to the user (e.g., "I couldn't find details for that specific plan.").
  - What if Claude fails to follow the tool use format?
- **Iteration Limit**: Implement a maximum number of tool use iterations per user query to prevent infinite loops.
- **Context Window Management**: For long conversations or large data returns from MCP, be mindful of Claude Sonnet's context window token limit. Summarize or truncate information if necessary.
- **Security**: If/when the MCP Layer calls real APIs or databases, ensure it uses secure authentication and authorization.

## 4. Conclusion

Implementing MCP with Claude Sonnet on AWS Bedrock for this PoC revolves around a "tool use" pattern facilitated by careful prompt engineering and an Orchestration Layer. The Orchestrator manages the dialogue, interprets Claude's requests for external actions (data lookups via MCP), invokes the MCP Layer to fulfill these requests using (initially mock) data sources, and then feeds this new contextual information back to Claude. This enables Claude Sonnet to provide more accurate, data-grounded, and useful responses relevant to One NZ's specific business needs.
