export interface GreetResponse {
  message: string;
  timestamp: number;
}

export interface EchoPayload {
  status: string;
  detail: string;
}

export interface ChannelChunk {
  index: number;
  data: number[];
  size: number;
}

export interface BenchmarkResult {
  payload_size: number;
  round_trip_ms: number;
}
