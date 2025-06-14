import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { PingPongRequest, PingPongResponse, ToolError } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class PingPongTool {
  private readonly toolDefinition: Tool = {
    name: 'ping_pong',
    description: 'Responds with "pong" when you send "ping"',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The message to send (should be "ping" to get "pong" response)'
        }
      },
      required: ['message']
    }
  };

  public getDefinition(): Tool {
    return this.toolDefinition;
  }

  public async execute(args: unknown): Promise<PingPongResponse> {
    try {
      const validatedArgs = this.validateArguments(args);
      logger.info('Executing ping_pong tool', { message: validatedArgs.message });

      const response = this.processMessage(validatedArgs.message);
      
      const result: PingPongResponse = {
        response,
        timestamp: new Date().toISOString()
      };

      logger.info('Ping_pong tool execution completed', result);
      return result;
    } catch (error) {
      logger.error('Error executing ping_pong tool', { error });
      throw this.createToolError('EXECUTION_ERROR', 'Failed to execute ping_pong tool', error);
    }
  }

  private validateArguments(args: unknown): PingPongRequest {
    if (!args || typeof args !== 'object') {
      throw this.createToolError('INVALID_ARGS', 'Arguments must be an object');
    }

    const { message } = args as Record<string, unknown>;

    if (typeof message !== 'string') {
      throw this.createToolError('INVALID_MESSAGE', 'Message must be a string');
    }

    if (message.trim().length === 0) {
      throw this.createToolError('EMPTY_MESSAGE', 'Message cannot be empty');
    }

    return { message: message.trim() };
  }

  private processMessage(message: string): string {
    const normalizedMessage = message.toLowerCase().trim();
    
    if (normalizedMessage === 'ping') {
      return 'pong';
    }
    
    return `I received "${message}", but I only respond with "pong" when you send "ping"`;
  }

  private createToolError(code: string, message: string, details?: unknown): ToolError {
    return {
      code,
      message,
      details
    };
  }
}