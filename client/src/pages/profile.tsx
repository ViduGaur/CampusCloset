import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemCard } from "@/components/home/item-card";
import { MapPin, Mail, Star, PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Profile() {
  const { user } = useAuth();
  const [, params] = useLocation();
  const { toast } = useToast();
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  
  // Check if we're viewing someone else's profile or our own
  useEffect(() => {
    // Extract user ID from URL or use current user's ID
    const id = params === "/profile" && user 
      ? user.id 
      : params.startsWith("/profile/") && params.length > 9
        ? parseInt(params.substring(9))
        : null;
        
    setProfileUserId(id);
    
    if (!id && !user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to view profiles",
        variant: "destructive",
      });
    }
  }, [params, user, toast]);
  
  // Fetch profile user data if it's not the current user
  const { data: profileUser, isLoading: isProfileLoading } = useQuery({
    queryKey: ["/api/users", profileUserId],
    enabled: !!profileUserId && profileUserId !== user?.id,
  });
  
  // Fetch user's items
  const { data: userItems, isLoading: isItemsLoading } = useQuery({
    queryKey: [`/api/users/${profileUserId}/items`],
    enabled: !!profileUserId,
  });
  
  // Use either fetched profile data or current user
  const displayUser = profileUserId === user?.id ? user : profileUser;
  
  if (!profileUserId) return null; // Don't render until we have a user ID
  
  const isOwnProfile = user && profileUserId === user.id;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {isProfileLoading ? (
            <div className="flex flex-col md:flex-row gap-6">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-32 mt-4" />
              </div>
            </div>
          ) : displayUser ? (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-6">
                <Avatar className="h-32 w-32">
                  <AvatarImage 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayUser.fullName}`} 
                    alt={displayUser.fullName} 
                  />
                  <AvatarFallback className="text-4xl">
                    {displayUser.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">{displayUser.fullName}</h1>
                  <p className="text-gray-500">@{displayUser.username}</p>
                  
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{displayUser.hostel}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="h-4 w-4 mr-1" />
                      <span>{displayUser.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Star className="h-4 w-4 mr-1 text-yellow-400" />
                      <span>Not yet rated</span>
                    </div>
                  </div>
                  
                  {isOwnProfile && (
                    <div className="mt-4">
                      <Link href="/upload">
                        <Button className="flex items-center">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          List New Item
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8 text-center">
              <p className="text-gray-500">User not found</p>
            </div>
          )}
          
          <Tabs defaultValue="items">
            <TabsList className="mb-4">
              <TabsTrigger value="items">Items for Rent</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              {isOwnProfile && (
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="items">
              {isItemsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-48 w-full rounded-md" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : userItems && userItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {userItems.map((item: any) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-10 text-center">
                  <p className="text-gray-500 mb-4">No items listed yet</p>
                  {isOwnProfile && (
                    <Link href="/upload">
                      <Button>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        List Your First Item
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="reviews">
              <div className="bg-white rounded-lg shadow-sm p-10 text-center">
                <p className="text-gray-500">No reviews yet</p>
              </div>
            </TabsContent>
            
            {isOwnProfile && (
              <TabsContent value="transactions">
                <div className="bg-white rounded-lg shadow-sm p-10 text-center">
                  <p className="text-gray-500">No transactions yet</p>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
