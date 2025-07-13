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
import { useSearch } from "wouter";

export default function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearch();
  // Parse userId and itemId from query params for direct navigation
  const urlParams = new URLSearchParams(searchParams);
  const initialUserId = urlParams.get("userId") ? parseInt(urlParams.get("userId")!) : null;
  const initialItemId = urlParams.get("itemId") ? parseInt(urlParams.get("itemId")!) : null;
  // State for selected conversation (userId + itemId)
  const [selected, setSelected] = useState<{ userId: number; itemId: number } | null>(
    initialUserId && initialItemId ? { userId: initialUserId, itemId: initialItemId } : null
  );
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get all rental-based conversations for the current user
  const { data: threads, isLoading: threadsLoading, error: threadsError } = useQuery({
    queryKey: ["/api/messages/threads"],
    queryFn: () => apiRequest("GET", "/api/messages/threads"),
    enabled: !!user,
    retry: 3,
    retryDelay: 1000,
  });

  // Get messages for the selected conversation
  const { data: messages, isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ["/api/messages/thread", selected?.userId, selected?.itemId],
    queryFn: () => selected ? apiRequest("GET", `/api/messages/thread?userId=${selected.userId}&itemId=${selected.itemId}`) : [],
    enabled: !!user && !!selected,
    refetchInterval: 5000,
    retry: 3,
    retryDelay: 1000,
  });

  // Get user info about the other person in the conversation
  const { data: otherUser, isLoading: otherUserLoading, error: otherUserError } = useQuery({
    queryKey: ["/api/users", selected?.userId],
    queryFn: () => selected ? apiRequest("GET", `/api/users/${selected.userId}/profile`) : null,
    enabled: !!user && !!selected,
    retry: 3,
    retryDelay: 1000,
  });

  // Send a message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ toUserId, content, itemId }: { toUserId: number, content: string, itemId: number }) => {
      return apiRequest("POST", "/api/messages/send", { toUserId, content, itemId });
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", selected?.userId, selected?.itemId] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/threads"] });
    }
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Format timestamp to a user-friendly format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Prepare thread previews (unique per userId+itemId)
  const threadPreviews = threads ? threads.map((thread: any) => {
    const isSelected = selected && thread.userId === selected.userId && thread.itemId === selected.itemId;
    return {
      userId: thread.userId,
      userName: thread.userName,
      itemId: thread.itemId,
      itemName: thread.itemName,
      lastMessage: thread.lastMessage,
      timestamp: thread.timestamp,
      isSelected
    };
  }) : [];

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

  // Handle loading state
  if (threadsLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        <div className="text-center py-20">
          <div className="text-lg">Loading your messages...</div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (threadsError) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        <div className="text-center py-20 text-red-600">
          <div className="text-lg">Failed to load messages. Please try again later.</div>
          <Button 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-280px)] min-h-[500px]">
        {/* Thread list: only users with a rental relationship, unique per user+item */}
        <div className="border rounded-lg shadow-sm overflow-hidden bg-white">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="font-semibold text-gray-700">Conversations</h2>
          </div>
          <div className="overflow-y-auto h-[calc(100%-56px)]">
            {threadPreviews.length > 0 ? (
              <div>
                {threadPreviews.map((thread: any) => (
                  <div
                    key={thread.userId + "-" + thread.itemId}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${thread.isSelected ? 'bg-primary/5' : ''}`}
                    onClick={() => setSelected({ userId: thread.userId, itemId: thread.itemId })}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${thread.userName}`} />
                        <AvatarFallback><User /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <p className="font-medium text-gray-900 truncate">{thread.userName}</p>
                          <span className="text-xs text-gray-500">{thread.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{thread.itemName}</p>
                        <p className="text-xs text-gray-400 mt-1">{thread.lastMessage}</p>
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
          {selected ? (
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
                            <div className="flex items-center mb-1">
                              <span className="font-semibold text-xs text-gray-700 mr-2">{isFromMe ? "You" : otherUser?.fullName}</span>
                              <span className="text-xs text-gray-400">{formatTimestamp(message.createdAt)}</span>
                            </div>
                            <div className="text-sm text-gray-900">{message.content}</div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="text-gray-400">No messages yet.</div>
                )}
              </div>
              {/* Message input */}
              <form onSubmit={e => {
                e.preventDefault();
                if (!messageText.trim() || !selected) return;
                sendMessageMutation.mutate({
                  toUserId: selected.userId,
                  content: messageText,
                  itemId: selected.itemId
                });
              }} className="p-4 border-t flex gap-2 bg-white">
                <Input
                  className="flex-1"
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                />
                <Button type="submit" disabled={sendMessageMutation.isPending || !messageText.trim()}>
                  <Send className="h-4 w-4 mr-1" /> Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <MessageCircle className="h-10 w-10 mr-2" />
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}