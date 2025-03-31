import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemCard } from "@/components/home/item-card";
import { ItemGrid } from "@/components/home/item-grid";
import { PlusCircle, Package, ShoppingCart } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";

export default function MyItems() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("my-listings");

  // Get items the user has listed
  const { data: myListings, isLoading: myListingsLoading } = useQuery({
    queryKey: ["/api/items/owner"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user
  });

  // Get approved rental requests where user is the requester
  const { data: myRentals, isLoading: myRentalsLoading } = useQuery({
    queryKey: ["/api/rental-requests/requester"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user
  });

  // Get items based on rental requests
  const { data: rentedItems, isLoading: rentedItemsLoading } = useQuery({
    queryKey: ["/api/items/rented"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user && !!myRentals && myRentals.length > 0
  });

  // Get pending rental requests for user's items
  const { data: pendingRequests, isLoading: pendingRequestsLoading } = useQuery({
    queryKey: ["/api/rental-requests/pending"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user
  });

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">You're not signed in</h1>
        <p className="text-gray-600 mb-8">Please sign in to view your items</p>
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

  const isLoading = myListingsLoading || myRentalsLoading || rentedItemsLoading || pendingRequestsLoading;
  const hasMyListings = myListings && myListings.length > 0;
  const hasRentedItems = rentedItems && rentedItems.length > 0;
  const hasPendingRequests = pendingRequests && pendingRequests.length > 0;

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Items</h1>
        <Link href="/upload-item">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Upload Item
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="my-listings" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-listings" className="flex items-center">
            <Package className="mr-2 h-4 w-4" />
            My Listings
            {hasPendingRequests && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rented-items" className="flex items-center">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Items I'm Renting
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-listings" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading your listings...</div>
          ) : hasMyListings ? (
            <>
              {hasPendingRequests && (
                <div className="bg-yellow-50 p-4 rounded-md mb-6">
                  <h3 className="font-medium text-yellow-800 mb-2">Pending Rental Requests</h3>
                  <p className="text-yellow-700 mb-2">
                    You have {pendingRequests.length} pending rental request{pendingRequests.length !== 1 ? 's' : ''}.
                  </p>
                  <Link href="/requests">
                    <Button variant="outline" size="sm">View Requests</Button>
                  </Link>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {myListings.map((item: any) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <Package className="h-10 w-10 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items listed yet</h3>
              <p className="text-gray-500 mb-4">
                Start earning by listing your underused items for rent!
              </p>
              <Link href="/upload-item">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Upload Item
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="rented-items" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading your rented items...</div>
          ) : hasRentedItems ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {rentedItems.map((item: any) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <ShoppingCart className="h-10 w-10 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">You haven't rented any items yet</h3>
              <p className="text-gray-500 mb-4">
                Browse available items and rent what you need!
              </p>
              <Link href="/browse">
                <Button>
                  Browse Items
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}