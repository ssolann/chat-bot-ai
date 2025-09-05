export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isTyping?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}
