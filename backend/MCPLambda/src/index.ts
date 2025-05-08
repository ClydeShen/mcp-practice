import { APIGatewayProxyResult, Handler } from 'aws-lambda';
import mockDataSource from './data/mock-data.json';

// Type definitions for our mock data
interface CustomerPlanInfo {
  name: string;
  planName: string;
  dataAllowanceMB?: number;
  dataUsedMB?: number;
  nextBillingDate?: string;
  loyaltyTier?: string;
  balanceNZD?: number;
  lastTopUpDate?: string;
  bonusDataMB?: number;
  broadbandType?: string;
  speedTier?: string;
  contractEndDate?: string;
  currentIssues?: string[];
  accountManager?: string;
  numberOfLines?: number;
  monthlySpendNZD?: number;
}

interface ProductInfo {
  productName: string;
  category: string;
  priceNZD: number;
  priceFrequency: string;
  description: string;
  features?: string[];
  availability?: string;
  coverageDetails?: string[];
  includedDestinations?: string[];
}

interface KnowledgeBaseArticle {
  title: string;
  category: string;
  steps?: string[];
  commonIssues?: Array<{ issue: string; solution: string }>;
  lastUpdated: string;
}

interface MockData {
  customerPlanInfo: Record<string, CustomerPlanInfo>;
  productInfo: Record<string, ProductInfo>;
  knowledgeBase: Record<string, KnowledgeBaseArticle>;
}

// Cast the imported JSON to our defined type
const mockData = mockDataSource as MockData;

// Event type definitions
interface BaseEventInput {
  dataType: string;
  id?: string; // Generic ID, specific key like customerId will be checked inside
}

// More specific event types for better type checking, though we'll parse dynamically
interface CustomerInfoEventInput extends BaseEventInput {
  dataType: 'customerPlanInfo';
  customerId: string;
}

interface ProductInfoEventInput extends BaseEventInput {
  dataType: 'productInfo';
  productId: string;
}

interface KnowledgeBaseEventInput extends BaseEventInput {
  dataType: 'knowledgeBase';
  articleId: string;
}

type McpEvent =
  | CustomerInfoEventInput
  | ProductInfoEventInput
  | KnowledgeBaseEventInput;

export const handler: Handler<McpEvent, APIGatewayProxyResult> = async (
  event
): Promise<APIGatewayProxyResult> => {
  console.log('MCPLambda received event:', JSON.stringify(event, null, 2));

  const { dataType } = event;
  let data: any;
  let id: string | undefined;

  try {
    switch (dataType) {
      case 'customerPlanInfo':
        id = (event as CustomerInfoEventInput).customerId;
        if (!id) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'Missing customerId for customerPlanInfo',
            }),
          };
        }
        data = mockData.customerPlanInfo[id];
        break;
      case 'productInfo':
        id = (event as ProductInfoEventInput).productId;
        if (!id) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'Missing productId for productInfo',
            }),
          };
        }
        data = mockData.productInfo[id];
        break;
      case 'knowledgeBase':
        id = (event as KnowledgeBaseEventInput).articleId;
        if (!id) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'Missing articleId for knowledgeBase',
            }),
          };
        }
        data = mockData.knowledgeBase[id];
        break;
      default:
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: `Invalid dataType: ${dataType}` }),
        };
    }

    if (data) {
      console.log(
        `Data found for ${dataType} with ID ${id}:`,
        JSON.stringify(data, null, 2)
      );
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    } else {
      console.log(`No data found for ${dataType} with ID ${id}`);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: `Data not found for ${dataType} with ID ${id}`,
        }),
      };
    }
  } catch (error: any) {
    console.error('Error processing MCPLambda event:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal Server Error',
        details: error.message,
      }),
    };
  }
};
