import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Send, ExternalLink, FileText, Globe } from "lucide-react";
import { Chat, Source } from "@/types/chat";
import { useState, useEffect, useRef } from "react";

interface MainContentProps {
  currentChat: Chat | null;
  onNewChat: () => void;
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
}

const MainContent = ({
  currentChat,
  onNewChat,
  onSendMessage,
  isLoading = false,
}: MainContentProps) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-resize textarea function
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  // Auto-resize textarea when message changes
  useEffect(() => {
    autoResizeTextarea();
  }, [message]);

  // Initialize textarea height on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "52px"; // Set initial height
    }
  }, []);

  const handleSend = () => {
    if (message.trim() && onSendMessage) {
      onSendMessage(message.trim());
      setMessage("");
      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Component to display sources
  const SourcesDisplay = ({
    sources,
    browsingTriggered,
  }: {
    sources?: Source[];
    browsingTriggered?: boolean;
  }) => {
    if (!sources || sources.length === 0) return null;

    const documentSources = sources.filter((s) => s.type === "document");
    const webSources = sources.filter((s) => s.type === "web");

    return (
      <div className="mt-3 space-y-2">
        {browsingTriggered && (
          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            <Globe className="inline w-3 h-3 mr-1" />
            Web search was used to enhance the response
          </div>
        )}

        {documentSources.length > 0 && (
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center text-xs font-medium text-gray-700 mb-2">
              <FileText className="w-3 h-3 mr-1" />
              Document Sources ({documentSources.length})
            </div>
            <div className="space-y-2">
              {documentSources.map((source, idx) => (
                <div key={idx} className="text-xs bg-white p-2 rounded border">
                  <div className="font-medium text-gray-800">
                    {source.title}
                  </div>
                  <div className="text-gray-600 mt-1">{source.snippet}</div>
                  <div className="text-gray-500 mt-1">
                    Confidence: {source.confidence}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {webSources.length > 0 && (
          <div className="border rounded-lg p-3 bg-blue-50">
            <div className="flex items-center text-xs font-medium text-blue-700 mb-2">
              <Globe className="w-3 h-3 mr-1" />
              Web Sources ({webSources.length})
            </div>
            <div className="space-y-2">
              {webSources.map((source, idx) => (
                <div key={idx} className="text-xs bg-white p-2 rounded border">
                  <div className="font-medium text-gray-800">
                    {source.title}
                  </div>
                  <div className="text-gray-600 mt-1">{source.snippet}</div>
                  {source.link && (
                    <a
                      href={source.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center mt-1"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {source.source}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30 min-w-0 overflow-hidden">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Welcome to ChatBot</h2>
          <p className="text-muted-foreground mb-4">
            Select a chat from the sidebar or start a new conversation to begin
            chatting with the AI assistant.
          </p>
          <Button onClick={onNewChat} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Start New Chat
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Chat Header */}
      <div className="border-b bg-background px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {currentChat.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {currentChat.messages.length} message
            {currentChat.messages.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Messages Display Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {currentChat.messages.length === 0 ? (
            <div className="text-center text-muted-foreground">
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            currentChat.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {message.isTyping ? (
                    <div className="flex items-center space-x-1">
                      <div className="flex space-x-1">
                        <div
                          className="w-2 h-2 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                      <span className="text-sm ml-2">Thinking...</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                      {message.role === "assistant" && (
                        <SourcesDisplay
                          sources={message.sources}
                          browsingTriggered={message.browsingTriggered}
                        />
                      )}
                    </div>
                  )}
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleMessageChange}
                onKeyDown={handleKeyPress}
                placeholder="Type your message here..."
                className="resize-none pr-12 min-h-[52px] max-h-[200px] py-3 text-sm leading-relaxed overflow-y-auto"
                rows={1}
                style={{ height: "auto" }}
              />
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Helper text */}
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Press Enter to send, Shift + Enter for new line</span>
            <span>{message.length} characters</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContent;
