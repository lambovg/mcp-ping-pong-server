import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolResult
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { PingPongTool } from './tools/pingPongTools';
import { logger } from './utils/logger.js';
import { ServerConfig } from './types/index.js';

// Load environment variables
dotenv.config();

class MCPPingPongServer {
  private server: Server;
  private pingPongTool: PingPongTool;
  private config: ServerConfig;

  constructor() {
    this.config = this.loadConfig();
    this.pingPongTool = new PingPongTool();
    this.server = new Server(
      {
        name: this.config.serverName,
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  private loadConfig(): ServerConfig {
    return {
      serverName: process.env.MCP_SERVER_NAME || 'ping-pong-server',
      logLevel: process.env.LOG_LEVEL || 'info',
      nodeEnv: process.env.NODE_ENV || 'development'
    };
  }

  private setupHandlers(): void {
    this.setupToolHandlers();
    this.setupErrorHandlers();
  }

  private setupToolHandlers(): void {
    // Handler for listing available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.info('Handling list tools request');
      
      const tools: Tool[] = [this.pingPongTool.getDefinition()];
      
      return {
        tools
      };
    });

    // Handler for calling tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      logger.info('Handling tool call request', { 
        toolName: request.params.name,
        arguments: request.params.arguments 
      });

      try {
        if (request.params.name === 'ping_pong') {
          const result = await this.pingPongTool.execute(request.params.arguments);
          
          // Return proper CallToolResult format
          const toolResult: CallToolResult = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
          
          return toolResult;
        }

        // For unknown tools, return an error
        const errorResult: CallToolResult = {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: `Unknown tool: ${request.params.name}`,
                timestamp: new Date().toISOString()
              }, null, 2)
            }
          ],
          isError: true
        };
        
        return errorResult;
      } catch (error) {
        logger.error('Error calling tool', { 
          toolName: request.params.name,
          error 
        });

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        const errorResult: CallToolResult = {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: errorMessage,
                timestamp: new Date().toISOString()
              }, null, 2)
            }
          ],
          isError: true
        };
        
        return errorResult;
      }
    });
  }

  private setupErrorHandlers(): void {
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error });
      process.exit(1);
    });

    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      process.exit(0);
    });
  }

  public async start(): Promise<void> {
    try {
      logger.info('Starting MCP Ping Pong Server', { config: this.config });
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      logger.info('MCP Ping Pong Server started successfully');
    } catch (error) {
      logger.error('Failed to start MCP server', { error });
      throw error;
    }
  }
}

// Main execution
if (require.main === module) {
  const server = new MCPPingPongServer();
  
  server.start().catch((error) => {
    logger.error('Fatal error starting server', { error });
    process.exit(1);
  });
}

export { MCPPingPongServer };
