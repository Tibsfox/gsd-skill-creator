/**
 * MockMeshServer — HTTP server simulating Ollama and OpenAI-compatible endpoints.
 *
 * Used in integration tests to verify mesh flow without real model backends.
 * Supports configurable responses, error simulation, and request history tracking.
 */

import * as http from 'node:http';

// ============================================================================
// Types
// ============================================================================

export interface RequestRecord {
  method: string;
  url: string;
  body: unknown;
  headers: Record<string, string>;
  timestamp: string;
}

// ============================================================================
// Default responses
// ============================================================================

const DEFAULT_CHAT_RESPONSE = {
  id: 'mock-completion-1',
  model: 'mock-model',
  choices: [{ message: { content: 'Mock response content' } }],
  usage: { prompt_tokens: 10, completion_tokens: 20 },
};

const DEFAULT_MODELS_RESPONSE = {
  data: [{ id: 'mock-model', context_length: 4096 }],
};

const DEFAULT_OLLAMA_TAGS_RESPONSE = {
  models: [{
    name: 'mock-model:latest',
    model: 'mock-model:latest',
    size: 4000000000,
    digest: 'abc123',
    details: { parameter_size: '7B', quantization_level: 'Q4_K_M', family: 'llama' },
  }],
};

// ============================================================================
// MockMeshServer
// ============================================================================

export class MockMeshServer {
  private server: http.Server | null = null;
  private port = 0;
  private responses = new Map<string, object>();
  private errors = new Map<string, { statusCode: number; body?: string }>();
  private requestHistory = new Map<string, RequestRecord[]>();

  constructor() {
    // Set default responses
    this.responses.set('/v1/chat/completions', DEFAULT_CHAT_RESPONSE);
    this.responses.set('/v1/models', DEFAULT_MODELS_RESPONSE);
    this.responses.set('/api/tags', DEFAULT_OLLAMA_TAGS_RESPONSE);
  }

  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        await this.handleRequest(req, res);
      });

      this.server.listen(0, '127.0.0.1', () => {
        const addr = this.server!.address();
        if (addr && typeof addr === 'object') {
          this.port = addr.port;
          resolve(this.port);
        } else {
          reject(new Error('Failed to get server address'));
        }
      });

      this.server.on('error', reject);
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close(() => resolve());
    });
  }

  get baseUrl(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  setResponse(endpoint: string, body: object): void {
    this.responses.set(endpoint, body);
  }

  setError(endpoint: string, statusCode: number, body?: string): void {
    this.errors.set(endpoint, { statusCode, body });
  }

  clearError(endpoint: string): void {
    this.errors.delete(endpoint);
  }

  getRequests(endpoint: string): RequestRecord[] {
    return this.requestHistory.get(endpoint) ?? [];
  }

  clearRequests(): void {
    this.requestHistory.clear();
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = req.url ?? '/';
    const method = req.method ?? 'GET';

    // Parse body for POST requests
    let body: unknown = null;
    if (method === 'POST') {
      body = await this.readBody(req);
    }

    // Record request
    const record: RequestRecord = {
      method,
      url,
      body,
      headers: req.headers as Record<string, string>,
      timestamp: new Date().toISOString(),
    };
    const existing = this.requestHistory.get(url) ?? [];
    existing.push(record);
    this.requestHistory.set(url, existing);

    // Check for error simulation
    const error = this.errors.get(url);
    if (error) {
      res.writeHead(error.statusCode, { 'Content-Type': 'application/json' });
      res.end(error.body ?? JSON.stringify({ error: 'Simulated error' }));
      return;
    }

    // Check for configured response
    const response = this.responses.get(url);
    if (response) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
      return;
    }

    // Default 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  private readBody(req: http.IncomingMessage): Promise<unknown> {
    return new Promise((resolve) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf-8');
        try {
          resolve(JSON.parse(raw));
        } catch {
          resolve(raw);
        }
      });
      req.on('error', () => resolve(null));
    });
  }
}
