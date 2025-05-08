import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import { APIGatewayProxyResult, Handler } from 'aws-lambda';

// Environment variables (set in Lambda configuration)
const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-2';
const CLAUDE_MODEL_ID =
  process.env.CLAUDE_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';

const bedrockClient = new BedrockRuntimeClient({ region: AWS_REGION });

interface LambdaEvent {
  prompt: string;
}

// lambda handler
export const handler: Handler<LambdaEvent, APIGatewayProxyResult> = async (
  event
) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const prompt = event.prompt || 'Hello from TestOrchestratorLambda!';

  const bedrockRequestBody = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 512, // Adjusted for potentially longer stories
    messages: [{ role: 'user', content: prompt }],
  };

  const params: InvokeModelCommandInput = {
    body: JSON.stringify(bedrockRequestBody),
    modelId: CLAUDE_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
  };

  try {
    console.log(
      `Invoking Bedrock model ${CLAUDE_MODEL_ID} with prompt: "${prompt}"`
    );
    const command = new InvokeModelCommand(params);
    const response = await bedrockClient.send(command);

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const claudeResponseText =
      responseBody.content?.[0]?.text ||
      'No text content received from Claude.';

    console.log('Claude response:', JSON.stringify(responseBody, null, 2));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Successfully invoked Claude.',
        claudeResponse: claudeResponseText,
        fullClaudeResponse: responseBody,
      }),
    };
  } catch (error: any) {
    console.error('Error invoking Bedrock model:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to invoke Bedrock model',
        details: error.message,
        name: error.name,
      }),
    };
  }
};
