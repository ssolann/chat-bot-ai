import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Send } from "lucide-react";
import { Chat } from "@/types/chat";
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

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const handleSend = () => {
    if (message.trim() && onSendMessage) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
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
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message here..."
                className="resize-none pr-12 min-h-[52px] max-h-[120px] py-3 text-sm leading-relaxed"
                rows={1}
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
