import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Link } from "wouter";
import { queryClient, getQueryFn, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Send, User } from "lucide-react";

export default function Messages() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get all conversations for the current user
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/messages/conversations"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user
  });

  // Get messages for the selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/messages/conversation", selectedConversation],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user && selectedConversation !== null,
    refetchInterval: 5000 // Refetch every 5 seconds to see new messages
  });

  // Get user info about the other person in the conversation
  const { data: otherUser, isLoading: otherUserLoading } = useQuery({
    queryKey: ["/api/users", selectedConversation],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user && selectedConversation !== null
  });

  // Get all users (for demo purposes)
  const { data: allUsers, isLoading: allUsersLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user && (!conversations || conversations.length === 0)
  });

  // Send a message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ toUserId, content, itemId }: { toUserId: number, content: string, itemId?: number }) => {
      return apiRequest("/api/messages", {
        method: "POST",
        body: JSON.stringify({ toUserId, content, itemId })
      });
    },
    onSuccess: () => {
      // Invalidate and refetch the conversation
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversation", selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      setMessageText("");
    }
  });

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      toUserId: selectedConversation,
      content: messageText
    });
  };

  // Format timestamp to a user-friendly format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get the latest messages for each conversation
  const conversationPreviews = conversations
    ? Object.values(conversations).map((convo: any) => {
        // Format the timestamp
        const timestamp = new Date(convo.lastMessage.createdAt);
        const timeStr = formatTimestamp(timestamp.toISOString());
        
        // Determine if it's the selected conversation
        const isSelected = selectedConversation === convo.userId;
        
        return {
          userId: convo.userId,
          userName: convo.userName,
          userHostel: convo.userHostel,
          lastMessage: convo.lastMessage.content,
          timestamp: timeStr,
          isSelected
        };
      })
    : [];

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">You're not signed in</h1>
        <p className="text-gray-600 mb-8">Please sign in to view your messages</p>
        <div className="flex justify-center space-x-4">
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline">Register</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-280px)] min-h-[500px]">
        {/* Conversations list */}
        <div className="border rounded-lg shadow-sm overflow-hidden bg-white">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="font-semibold text-gray-700">Conversations</h2>
          </div>
          <div className="overflow-y-auto h-[calc(100%-56px)]">
            {conversationsLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversationPreviews.length > 0 ? (
              <div>
                {conversationPreviews.map((convo) => (
                  <div 
                    key={convo.userId}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${convo.isSelected ? 'bg-primary/5' : ''}`}
                    onClick={() => setSelectedConversation(convo.userId)}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${convo.userName}`} />
                        <AvatarFallback><User /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <p className="font-medium text-gray-900 truncate">{convo.userName}</p>
                          <span className="text-xs text-gray-500">{convo.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{convo.lastMessage}</p>
                        <p className="text-xs text-gray-400 mt-1">{convo.userHostel}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : allUsers && allUsers.length > 0 ? (
              <div>
                <div className="p-4 text-sm text-gray-500">
                  You don't have any conversations yet. Start a conversation with someone from your campus:
                </div>
                {allUsers
                  .filter((u: any) => u.id !== user.id)
                  .map((u: any) => (
                    <div 
                      key={u.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedConversation(u.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${u.fullName}`} />
                          <AvatarFallback><User /></AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{u.fullName}</p>
                          <p className="text-xs text-gray-400">{u.hostel}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <p>No conversations yet</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Message window */}
        <div className="border rounded-lg shadow-sm overflow-hidden bg-white md:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Conversation header */}
              <div className="p-4 bg-gray-50 border-b flex items-center space-x-3">
                {otherUserLoading ? (
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                ) : otherUser ? (
                  <>
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${otherUser.fullName}`} />
                      <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-semibold text-gray-700">{otherUser.fullName}</h2>
                      <p className="text-xs text-gray-500">{otherUser.hostel}</p>
                    </div>
                  </>
                ) : (
                  <h2 className="font-semibold text-gray-700">Loading conversation...</h2>
                )}
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] ${i % 2 === 0 ? 'bg-primary/10' : 'bg-white'} p-3 rounded-lg shadow-sm`}>
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message: any) => {
                      const isFromMe = message.fromUserId === user.id;
                      return (
                        <div key={message.id} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] ${isFromMe ? 'bg-primary/10' : 'bg-white'} p-3 rounded-lg shadow-sm`}>
                            <p className="text-gray-800">{message.content}</p>
                            <p className="text-xs text-gray-500 mt-1 text-right">
                              {formatTimestamp(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <p>No messages yet</p>
                      <p className="text-sm mt-1">Say hello to start the conversation!</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Message input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex items-center space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500 p-8">
                <MessageCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Select a conversation
                </h3>
                <p>
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}