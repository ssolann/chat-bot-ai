import { useState, useEffect } from "react";
import { Chat, Message } from "@/types/chat";
import ChatSidebar from "./ChatSidebar";
import MainContent from "./MainContent";

interface ChatPageProps {
  onNewChat?: () => void;
}

const ChatPage = ({ onNewChat }: ChatPageProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with empty chats - users will create their own
  useEffect(() => {
    setChats([]);
  }, []);

  const handleNewChat = () => {
    // Check if there's already an empty chat (either current or in the list)
    const hasEmptyChat = chats.some(
      (chat) =>
        chat.messages.length === 0 ||
        (chat.title === "New Chat" && chat.messages.length === 0)
    );

    // If current chat exists and has no messages, just switch to it
    if (currentChat && currentChat.messages.length === 0) {
      return;
    }

    // If there's already an empty chat in the list, switch to it instead of creating new one
    if (hasEmptyChat) {
      const emptyChat = chats.find(
        (chat) =>
          chat.messages.length === 0 ||
          (chat.title === "New Chat" && chat.messages.length === 0)
      );
      if (emptyChat) {
        setCurrentChat(emptyChat);
        return;
      }
    }

    // Only create a new chat if no empty chats exist
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      lastUpdated: new Date(),
    };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChat(newChat);
    if (onNewChat) onNewChat();
  };

  const selectChat = (chat: Chat) => {
    setCurrentChat(chat);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleSendMessage = async (content: string) => {
    // Helper function to generate a nice title from the message
    const generateTitle = (message: string): string => {
      const cleaned = message.trim().replace(/\s+/g, " "); // Clean up whitespace
      if (cleaned.length <= 50) {
        return cleaned;
      }
      return cleaned.slice(0, 47) + "...";
    };

    if (!currentChat) {
      // Create a new chat if none exists
      const newChat: Chat = {
        id: Date.now().toString(),
        title: generateTitle(content),
        messages: [],
        lastUpdated: new Date(),
      };
      setChats((prev) => [newChat, ...prev]);
      setCurrentChat(newChat);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    // Add user message to current chat
    const chatToUpdate = currentChat || {
      id: Date.now().toString(),
      title: generateTitle(content),
      messages: [],
      lastUpdated: new Date(),
    };

    // If this is the first message in an existing chat, update the title
    let updatedChat = {
      ...chatToUpdate,
      messages: [...chatToUpdate.messages, userMessage],
      lastUpdated: new Date(),
    };

    // Update title if this is the first user message
    if (
      chatToUpdate.messages.length === 0 ||
      chatToUpdate.title === "New Chat"
    ) {
      updatedChat = {
        ...updatedChat,
        title: generateTitle(content),
      };
    }

    setCurrentChat(updatedChat);
    setChats((prev) => {
      const existingIndex = prev.findIndex(
        (chat) => chat.id === updatedChat.id
      );
      if (existingIndex >= 0) {
        const newChats = [...prev];
        newChats[existingIndex] = updatedChat;
        return newChats;
      } else {
        return [updatedChat, ...prev];
      }
    });

    // Set loading state and add typing indicator
    setIsLoading(true);

    // Add typing indicator message
    const typingMessage: Message = {
      id: "typing-" + Date.now(),
      content: "🤔 Thinking...",
      role: "assistant",
      timestamp: new Date(),
      isTyping: true,
    };

    const chatWithTyping = {
      ...updatedChat,
      messages: [...updatedChat.messages, typingMessage],
      lastUpdated: new Date(),
    };

    setCurrentChat(chatWithTyping);
    setChats((prev) => {
      const existingIndex = prev.findIndex(
        (chat) => chat.id === chatWithTyping.id
      );
      if (existingIndex >= 0) {
        const newChats = [...prev];
        newChats[existingIndex] = chatWithTyping;
        return newChats;
      }
      return prev;
    });

    // Call the backend API
    try {
      // Prepare conversation history (exclude typing messages and current message)
      const conversationHistory = updatedChat.messages
        .filter((msg) => !msg.isTyping)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          conversationHistory: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let botContent = data.response;

      // Add demo mode indicator if present
      if (data.demoMode) {
        botContent += `\n\n💡 *${data.note}*`;
      }

      // Add sources if available
      if (data.sources && data.sources.length > 0) {
        botContent += "\n\n**Sources:**\n";
        data.sources.forEach(
          (
            source: {
              title: string;
              snippet: string;
              confidence: string;
              source: string;
              section: string;
              chunkIndex: number;
            },
            index: number
          ) => {
            // Use title if available, fallback to section name
            const displayTitle =
              source.title !== `Section ${source.chunkIndex}`
                ? source.title
                : source.section;

            botContent += `${index + 1}. **${displayTitle}** (${
              source.confidence
            } relevance)\n`;
            botContent += `   *"${source.snippet}"*\n\n`;
          }
        );
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botContent,
        role: "assistant",
        timestamp: new Date(),
      };

      // Remove typing indicator and add actual response
      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, botMessage],
        lastUpdated: new Date(),
      };

      setIsLoading(false);
      setCurrentChat(finalChat);
      setChats((prev) => {
        const existingIndex = prev.findIndex(
          (chat) => chat.id === finalChat.id
        );
        if (existingIndex >= 0) {
          const newChats = [...prev];
          newChats[existingIndex] = finalChat;
          return newChats;
        }
        return prev;
      });
    } catch (error) {
      console.error("Error calling backend:", error);
      setIsLoading(false);

      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `❌ Error connecting to backend: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Make sure the backend server is running on http://localhost:3001`,
        role: "assistant",
        timestamp: new Date(),
      };

      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, errorMessage],
        lastUpdated: new Date(),
      };

      setCurrentChat(finalChat);
      setChats((prev) => {
        const existingIndex = prev.findIndex(
          (chat) => chat.id === finalChat.id
        );
        if (existingIndex >= 0) {
          const newChats = [...prev];
          newChats[existingIndex] = finalChat;
          return newChats;
        }
        return prev;
      });
    }
  };

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden">
      <ChatSidebar
        chats={chats}
        currentChat={currentChat}
        isCollapsed={isCollapsed}
        onSelectChat={selectChat}
        onNewChat={handleNewChat}
        onToggleCollapse={toggleCollapse}
      />

      <MainContent
        currentChat={currentChat}
        onNewChat={handleNewChat}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ChatPage;
