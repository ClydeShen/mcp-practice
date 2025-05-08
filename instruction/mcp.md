# Technical Document: Model Context Protocol (MCP) with AWS Bedrock & Claude Sonnet

## 1. Introduction to Model Context Protocol (MCP)

**1.1. Definition and Purpose**

Model Context Protocol (MCP), in the context of Large Language Models (LLMs) like Claude Sonnet on AWS Bedrock, is not a formal, standardized network protocol (like HTTP or TCP/IP). Instead, it refers to the **structured methods and conventions used to provide an LLM with relevant information (context) beyond the immediate user query, enabling it to generate more accurate, relevant, coherent, and personalized responses.**

The "protocol" aspect implies a defined way of:

1.  **Gathering Context**: Collecting information from various sources.
2.  **Structuring Context**: Organizing this information into a format the LLM can understand and utilize effectively.
3.  **Delivering Context**: Injecting this structured information into the prompt sent to the LLM.
4.  **Utilizing Context**: The LLM using this provided information to perform its reasoning and generate a response.
5.  **Updating Context (Optional but common)**: Persisting changes or new information derived during the interaction for future use.

**1.2. Types of Context MCP Can Manage**

MCP can encompass various types of context, including but not limited to:

*   **Conversational History**: Previous turns in the ongoing dialogue between the user and the AI.
*   **User Profile Information**: Known details about the user (e.g., preferences, past interactions, account status).
*   **Session State**: Information specific to the current interaction (e.g., identified intent, slots filled, current task progress).
*   **External Knowledge (RAG - Retrieval Augmented Generation)**: Information retrieved from documents, databases, or knowledge bases relevant to the user's query.
*   **Tool/API Definitions & Responses (Action-Oriented MCP)**: Schemas of available tools/APIs the LLM can instruct the system to call, and the data returned from those calls. This is a key aspect when discussing "MCP Servers" in conjunction with Bedrock Agents.
*   **System Instructions/Persona**: Persistent guidelines defining the LLM's role, personality, constraints, and how it should process information.

**1.3. Benefits of Using MCP**

*   **Enhanced Accuracy**: LLMs can provide more factual answers when grounded with specific, relevant data.
*   **Improved Coherence**: Maintaining conversational history allows for natural, flowing dialogues.
*   **Personalization**: Using user-specific context leads to more tailored and relevant interactions.
*   **Reduced Hallucinations**: Providing factual context minimizes the chances of the LLM generating incorrect or fabricated information.
*   **Enabling Complex Task Completion**: By providing access to external tools and data, MCP allows LLMs to orchestrate and complete multi-step tasks.

## 2. Using MCP with AWS Bedrock and Claude Sonnet

This section outlines how to implement and utilize MCP when working with Claude Sonnet models (e.g., `anthropic.claude-3-sonnet-20240229-v1:0`) via the AWS Bedrock API. The core mechanism for delivering context to Claude Sonnet is through carefully constructed **prompts**, particularly using the `messages` API and the `system` prompt.

**2.1. Key Bedrock API Features for MCP Implementation with Claude Sonnet**

*   **`InvokeModel` API Endpoint**: The primary API for sending requests to Claude Sonnet on Bedrock.
*   **Request Body Structure (`application/json`)**:
    *   `anthropic_version`: Specifies the Anthropic API version (e.g., "bedrock-2023-05-31").
    *   `max_tokens`: Defines the maximum number of tokens to generate in the response.
    *   `system` (string, optional): A top-level parameter for providing system-level instructions, persona, and context that applies to the entire conversation. **This is a key place to inject persistent MCP rules or high-level context.**
    *   `messages` (array of message objects): This is the primary way to provide conversational history and the current user query. Each message object has:
        *   `role`: `"user"` or `"assistant"`. The conversation must alternate roles, starting with a "user" message.
        *   `content`: A string containing the text of the message. For Claude 3 models, `content` can also be an array of content blocks (e.g., for multimodal input, though for text-based MCP, it's typically a single text block).
    *   Other parameters like `temperature`, `top_p`, `top_k`, `stop_sequences` for controlling generation.

**2.2. Implementing Different MCP Aspects with Claude Sonnet**

**2.2.1. MCP for Conversational History**

*   **Mechanism**: Maintain a list of past user utterances and assistant responses in your application (e.g., in an Orchestration Layer, potentially stored in DynamoDB for persistence across sessions).
*   **Implementation**:
    1.  Before calling Claude Sonnet, retrieve the relevant conversation history for the current session.
    2.  Format this history as an array of message objects, alternating `role: "user"` and `role: "assistant"`.
    3.  Append the current user's new message (with `role: "user"`) to this array.
    4.  Pass this complete array as the `messages` parameter in the `InvokeModel` request body.
*   **Example Snippet (Conceptual for Request Body)**:
    ```json
    {
      "anthropic_version": "bedrock-2023-05-31",
      "max_tokens": 1024,
      "system": "You are a helpful One NZ assistant.",
      "messages": [
        {"role": "user", "content": "What plans do you have?"},
        {"role": "assistant", "content": "We have several mobile plans. Are you looking for prepaid or postpaid?"},
        {"role": "user", "content": "Tell me about postpaid."} 
      ]
    }
    ```
*   **Considerations**:
    *   **Token Limits**: Claude models have context window limits. Long conversations might exceed this. Implement truncation strategies (e.g., keep only the N most recent turns, summarize older turns).
    *   **Prompt Structure**: Ensure roles alternate correctly.

**2.2.2. MCP for System Instructions, Persona, and Rules**

*   **Mechanism**: Utilize the `system` prompt parameter.
*   **Implementation**:
    1.  Define a string containing all high-level instructions, the AI's persona, constraints, how it should interpret other context, or rules for interacting with "tools" (if you are building that logic).
    2.  Pass this string as the `system` parameter in the `InvokeModel` request.
*   **Example Snippet (Conceptual for Request Body)**:
    ```json
    {
      "anthropic_version": "bedrock-2023-05-31",
      "max_tokens": 1024,
      "system": "You are 'Kai', a friendly and knowledgeable One NZ mobile plan expert. Your goal is to help users find the best plan. If you need specific plan details that you don't know, you can ask the user to wait while you 'look it up' by responding with a special instruction like 'ACTION: MCP_FETCH_PLAN_DETAILS(plan_name)'. Do not invent plan details.",
      "messages": [
        {"role": "user", "content": "I need a good plan with lots of data."}
      ]
    }
    ```
*   **Considerations**: The `system` prompt provides overarching guidance. It's a powerful way to shape Claude's behavior consistently.

**2.2.3. MCP for External Knowledge (Basic RAG-like approach or Tool Use Data)**

This involves your application logic retrieving information *before* or *during* an interaction with Claude, and then injecting that information into the prompt.

*   **Mechanism**:
    1.  **Pre-computation (RAG-like)**: User asks a question. Your system retrieves relevant documents/chunks from a vector database or knowledge base. This retrieved text is then added to the prompt for Claude.
    2.  **Tool Use (Action-Oriented MCP)**:
        a.  Claude, based on its `system` prompt and the user query, determines it needs to use a "tool" (i.e., your application needs to call an external API or function). It might output a specially formatted string indicating this (as shown in the `system` prompt example above).
        b.  Your application (e.g., Orchestration Layer) parses this output, executes the tool/API call (this is your "MCP Layer" fetching data).
        c.  The result from the tool/API call is then formatted and included in a subsequent call to Claude, often as a new "user" or "assistant" message that provides the tool's output.
*   **Implementation (Illustrating Tool Use Data Injection)**:

    *Initial call to Claude (prompt includes instruction on how to request data):*
    ```json
    // System prompt tells Claude how to ask for data, e.g., "ACTION: MCP_FETCH_PLAN_DETAILS(plan_name)"
    // User asks: "Tell me about the Ultimate Unlimited plan."
    // Claude might respond (to the orchestrator): "ACTION: MCP_FETCH_PLAN_DETAILS(Ultimate Unlimited)" 
    ```

    *Orchestrator processes this, calls the MCP Layer, gets plan details. Then makes a second call to Claude:*
    ```json
    {
      "anthropic_version": "bedrock-2023-05-31",
      "max_tokens": 1024,
      "system": "You are 'Kai'...", // Same system prompt
      "messages": [
        {"role": "user", "content": "Tell me about the Ultimate Unlimited plan."},
        {"role": "assistant", "content": "ACTION: MCP_FETCH_PLAN_DETAILS(Ultimate Unlimited)"}, 
        // New message providing the context from MCP
        {"role": "user", "content": "CONTEXT_FROM_MCP: The Ultimate Unlimited plan costs $80/month, includes unlimited data, 5G access, and 200 international minutes."}
        // Claude will now use this context to formulate the actual answer to the user.
      ]
    }
    ```
*   **Considerations**:
    *   **Formatting**: Clearly delineate externally fetched context within the prompt so Claude can distinguish it from user conversation. Using a specific role or a prefix like "CONTEXT_FROM_MCP:" can help.
    *   **Multiple Tool Calls**: For complex tasks, this might involve several cycles of Claude requesting data -> Orchestrator/MCP fetching -> Claude processing.
    *   **Prompt Engineering**: Designing the `system` prompt and the format for tool requests/responses is critical.

**2.2.4. MCP for Session State / User Profile (Simplified)**

*   **Mechanism**: Store session-specific or user-specific information in your application (e.g., Orchestration Layer). Inject relevant pieces into the `system` prompt or as part of the `messages` (e.g., as an initial user message setting context).
*   **Implementation**:
    *   If user preferences are known (e.g., "user prefers pre-paid plans"), this can be added to the `system` prompt: `"...You know the user prefers pre-paid plans."`
    *   Or, at the start of the `messages` array: `{"role": "user", "content": "UserContext: I am a returning customer interested in pre-paid options."}`
*   **Considerations**: Balance the amount of this data with token limits and relevance to the current interaction.

## 3. Overall Workflow for MCP with Claude Sonnet in a Custom Application (e.g., Orchestration Layer)

1.  **Receive User Input**: (e.g., from Amazon Nova Sonic via frontend and then to Orchestrator).
2.  **Initialize/Retrieve Context**:
    *   Fetch conversation history for the session.
    *   Retrieve relevant user profile/session state.
    *   Define/retrieve the standard `system` prompt.
3.  **(Optional - RAG) Retrieve External Knowledge**: If the query suggests a need for RAG, perform a lookup in your knowledge sources.
4.  **Construct Prompt for Claude Sonnet**:
    *   Assemble the `system` prompt.
    *   Assemble the `messages` array, including history, current user input, and any retrieved RAG context or prior tool outputs.
5.  **Invoke Claude Sonnet via Bedrock API**: Send the structured request.
6.  **Process Claude's Response**:
    *   Parse the textual output.
    *   **Check for Tool/Action Requests**: If your `system` prompt defines a way for Claude to request actions (e.g., "ACTION: MCP_CALL_API(...)"), parse for these.
        *   If an action is requested:
            a.  Execute the action using your MCP Layer (call internal functions, external APIs, database queries).
            b.  Take the result from the MCP Layer.
            c.  Go back to Step 4 (Construct Prompt), this time adding the MCP result as new context in the `messages` array, and re-invoke Claude. This allows Claude to use the fetched data to formulate its final answer.
        *   If no action is requested (or after an action's result is processed): The response from Claude is the final textual answer.
7.  **Update Context**: Save the current user input and Claude's final assistant response to the conversation history. Update any other session state.
8.  **Deliver Response to User**: (e.g., Send text to Amazon Nova Sonic for TTS).

## 4. Conclusion

MCP is a conceptual framework for providing LLMs like Claude Sonnet on AWS Bedrock with the necessary information to perform effectively. Its implementation relies heavily on strategic prompt engineering, particularly utilizing the `system` prompt and the `messages` array in the Bedrock API. For advanced capabilities like interacting with external data sources or tools, a surrounding application logic (e.g., an Orchestration Layer managing calls to an MCP Layer) is required to interpret LLM outputs, execute actions, and feed results back into the LLM context. This iterative process of prompt, response, action, and re-prompt is key to building sophisticated agentic systems.