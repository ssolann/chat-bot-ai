import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  FolderOpen,
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
} from "lucide-react";
import { Chat } from "@/types/chat";

interface ChatSidebarProps {
  chats: Chat[];
  currentChat: Chat | null;
  isCollapsed: boolean;
  onSelectChat: (chat: Chat) => void;
  onNewChat: () => void;
  onToggleCollapse: () => void;
}

const ChatSidebar = ({
  chats,
  currentChat,
  isCollapsed,
  onSelectChat,
  onNewChat,
  onToggleCollapse,
}: ChatSidebarProps) => {
  const groupChatsByDate = (chats: Chat[]) => {
    const groups: Record<string, Chat[]> = {};

    chats.forEach((chat) => {
      const dateKey = formatDateKey(chat.lastUpdated);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(chat);
    });

    return groups;
  };

  const formatDateKey = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else if (date >= lastWeek) {
      return "Last 7 days";
    } else {
      return "Older";
    }
  };

  const groupedChats = groupChatsByDate(chats);

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-80"
      } transition-all duration-300 border-r bg-background flex flex-col shrink-0`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">ChatBot</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button
          onClick={onNewChat}
          className={`${isCollapsed ? "w-8 h-8 p-0" : "w-full"} justify-center`}
          variant="default"
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">New Chat</span>}
        </Button>
      </div>

      <Separator />

      {/* Chat History */}
      <ScrollArea className="flex-1 px-2 min-h-0">
        {!isCollapsed ? (
          <div className="py-2">
            {Object.entries(groupedChats).map(([dateGroup, groupChats]) => (
              <div key={dateGroup} className="mb-4">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Calendar className="h-3 w-3" />
                  {dateGroup}
                </div>
                <div className="space-y-1">
                  {groupChats.map((chat) => (
                    <Button
                      key={chat.id}
                      variant={
                        currentChat?.id === chat.id ? "secondary" : "ghost"
                      }
                      className="w-full justify-start text-left h-auto p-3 rounded-lg"
                      onClick={() => onSelectChat(chat)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-sm">
                            {chat.title}
                          </div>
                          {chat.messages.length > 0 && (
                            <div className="text-xs text-muted-foreground truncate mt-1">
                              {chat.messages[
                                chat.messages.length - 1
                              ].content.slice(0, 50)}
                              {chat.messages[chat.messages.length - 1].content
                                .length > 50 && "..."}
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {chat.lastUpdated.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            {chats.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium mb-1">No chat history yet</p>
                <p className="text-xs">Start a new conversation to begin</p>
              </div>
            )}
          </div>
        ) : (
          // Collapsed view - show only icons
          <div className="py-2 space-y-2">
            {chats.slice(0, 5).map((chat: Chat) => (
              <Button
                key={chat.id}
                variant={currentChat?.id === chat.id ? "secondary" : "ghost"}
                size="icon"
                className="w-8 h-8 mx-auto"
                onClick={() => onSelectChat(chat)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator />
    </div>
  );
};

export default ChatSidebar;
