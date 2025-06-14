export interface PingPongRequest {
  message: string;
}

export interface PingPongResponse {
  response: string;
  timestamp: string;
}

export interface ServerConfig {
  serverName: string;
  logLevel: string;
  nodeEnv: string;
}

export interface ToolError {
  code: string;
  message: string;
  details?: unknown;
}