import { useState } from "react";

// Simple types
interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

// Simple icon components
const PlusIcon = () => (
  <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </svg>
);

const MenuIcon = () => (
  <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const WorkingChatPage = () => {
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sampleChats: Chat[] = [
    {
      id: "1",
      title: "How to build a React app",
      messages: [
        {
          id: "1",
          content: "How to build a React app",
          role: "user",
          timestamp: new Date(),
        },
      ],
      lastUpdated: new Date(),
    },
    {
      id: "2",
      title: "JavaScript best practices",
      messages: [
        {
          id: "2",
          content: "What are JavaScript best practices?",
          role: "user",
          timestamp: new Date(Date.now() - 86400000),
        },
      ],
      lastUpdated: new Date(Date.now() - 86400000),
    },
    {
      id: "3",
      title: "CSS Grid vs Flexbox",
      messages: [
        {
          id: "3",
          content: "What's the difference between CSS Grid and Flexbox?",
          role: "user",
          timestamp: new Date(Date.now() - 172800000),
        },
      ],
      lastUpdated: new Date(Date.now() - 172800000),
    },
  ];

  const handleNewChat = () => {
    setCurrentChat(null);
  };

  const selectChat = (chat: Chat) => {
    setCurrentChat(chat);
  };

  return (
    <div className="flex h-screen w-screen bg-background">
      {/* Sidebar */}
      <div className={`chat-sidebar ${isCollapsed ? "hidden" : ""}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Chats</h2>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <MenuIcon />
          </button>
        </div>

        <button className="btn btn-primary w-full mb-4" onClick={handleNewChat}>
          <PlusIcon />
          <span className="ml-2">New Chat</span>
        </button>

        <div>
          <h3 className="text-sm text-muted-foreground mb-2">Recent</h3>
          {sampleChats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${
                currentChat?.id === chat.id ? "active" : ""
              }`}
              onClick={() => selectChat(chat)}
            >
              <div className="text-sm font-semibold truncate">{chat.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {chat.messages.length} message
                {chat.messages.length !== 1 ? "s" : ""}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {!currentChat ? (
          <div className="welcome-container">
            <div className="welcome-content">
              <div className="icon-container">
                <PlusIcon />
              </div>
              <h2 className="text-xl font-semibold mb-2">Welcome to ChatBot</h2>
              <p className="text-muted-foreground mb-4">
                Select a chat from the sidebar or start a new conversation to
                begin chatting with the AI assistant.
              </p>
              <button className="btn btn-primary mt-4" onClick={handleNewChat}>
                <PlusIcon />
                <span className="ml-2">Start New Chat</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="border-b bg-background px-6 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold">{currentChat.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {currentChat.messages.length} message
                  {currentChat.messages.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={handleNewChat}
              >
                <PlusIcon />
                <span className="ml-2">New Chat</span>
              </button>
            </div>

            {/* Messages Area */}
            <div className="messages-area">
              <div style={{ maxWidth: "1024px", margin: "0 auto" }}>
                {currentChat.messages.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    <p>No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  currentChat.messages.map((message: Message) => (
                    <div key={message.id} className={`message ${message.role}`}>
                      <div className={`message-bubble ${message.role}`}>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-2" style={{ opacity: 0.7 }}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Collapsed sidebar toggle */}
      {isCollapsed && (
        <button
          className="btn btn-outline"
          style={{ position: "absolute", top: "1rem", left: "1rem" }}
          onClick={() => setIsCollapsed(false)}
        >
          <MenuIcon />
        </button>
      )}
    </div>
  );
};

export default WorkingChatPage;
