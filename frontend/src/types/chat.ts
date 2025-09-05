export interface Source {
  id: string;
  title: string;
  snippet: string;
  content: string;
  source: string;
  confidence: string;
  section?: string;
  chunkIndex?: number;
  type: "document" | "web";
  link?: string;
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isTyping?: boolean;
  sources?: Source[];
  webSearchUsed?: boolean;
  browsingTriggered?: boolean;
  bestSimilarity?: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}
