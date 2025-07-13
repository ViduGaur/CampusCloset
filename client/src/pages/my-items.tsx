import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemCard } from "@/components/home/item-card";
import { ItemGrid } from "@/components/home/item-grid";
import { RentedItemCard } from "@/components/ratings/rented-item-card";
import { PlusCircle, Package, ShoppingCart, Star, MessageSquare } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

// Define interfaces for our data structures
// Define a partial type that allows flexibility in API responses
interface Item {
  id: number;
  name: string;
  description: string;
  size: string;
  pricePerDay: number;
  imageData: string;
  isAvailable: boolean;
  categoryId: number;
  category?: {
    id?: number;
    name: string;
  };
  ownerId: number;
  owner: {
    id: number;
    hostel: string;
  };
  createdAt?: string;  // Make optional to handle API responses that might not include it
}

interface UserInfo {
  id: number;
  username: string;
  fullName?: string;
  hostel: string;
  isVerified?: boolean;
  averageRating?: number;
  ratingCount?: number;
}

interface RentalRequest {
  id: number;
  itemId: number;
  requesterId: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt?: string;
  item?: Item;
  requester?: UserInfo;
  owner?: UserInfo;
  completedByLender?: boolean;
  completedByBorrower?: boolean;
}

// Minimal Messages UI for a rental
function RentalMessages({ rental }: { rental: any }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const { data: thread, refetch } = useQuery({
    queryKey: ["/api/messages/thread", rental.itemId, rental.owner?.id],
    queryFn: () => apiRequest("GET", `/api/messages/thread?userId=${rental.owner?.id}&itemId=${rental.itemId}`),
    enabled: !!user && !!rental.itemId && !!rental.owner?.id,
  });
  const sendMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/messages/send", {
      toUserId: rental.owner?.id,
      itemId: rental.itemId,
      content: message,
    }),
    onSuccess: () => { setMessage(""); refetch(); },
  });
  return (
    <div className="border rounded p-2 mt-2">
      <div className="max-h-40 overflow-y-auto text-sm mb-2">
        {thread && thread.length > 0 ? thread.map((msg: any) => (
          <div key={msg.id} className={msg.fromUserId === user?.id ? "text-right" : "text-left"}>
            <span className="font-semibold">{msg.fromUserId === user?.id ? "You" : rental.owner?.username}:</span> {msg.content}
            <span className="ml-2 text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString()}</span>
          </div>
        )) : <div className="text-gray-400">No messages yet.</div>}
      </div>
      <form onSubmit={e => { e.preventDefault(); sendMutation.mutate(); }} className="flex gap-2">
        <input className="flex-1 border rounded px-2 py-1" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." />
        <Button type="submit" size="sm" disabled={sendMutation.isPending || !message.trim()}>Send</Button>
      </form>
    </div>
  );
}

function OwnerRentalRequests() {
  const { user } = useAuth();
  const { data: pendingRequests, refetch } = useQuery({
    queryKey: ["/api/rental-requests/pending"],
    enabled: !!user,
    queryFn: () => apiRequest("GET", "/api/rental-requests/pending"),
  });
  const reviewMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: string }) =>
      apiRequest("POST", `/api/rental-requests/${id}/review`, { action }),
    onSuccess: () => refetch(),
  });
  if (!pendingRequests) return null;
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Rental Requests for Your Items</h2>
      {pendingRequests.length === 0 ? (
        <div>No pending requests.</div>
      ) : (
        <ul className="space-y-4">
          {pendingRequests.map((req: any) => (
            <li key={req.id} className="border p-4 rounded">
              <div>
                <strong>Item:</strong> {req.item?.name}
              </div>
              <div>
                <strong>Requester:</strong> {req.requester?.username}
                {req.requester?.id && (
                  <Link href={`/profile/${req.requester.id}`}>
                    <Button size="sm" variant="outline" className="ml-2">View Profile</Button>
                  </Link>
                )}
              </div>
              <div>
                <strong>Dates:</strong> {req.startDate} to {req.endDate}
              </div>
              <div>
                <Button
                  onClick={() => reviewMutation.mutate({ id: req.id, action: "approve" })}
                  disabled={reviewMutation.isPending}
                  className="mr-2"
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => reviewMutation.mutate({ id: req.id, action: "reject" })}
                  disabled={reviewMutation.isPending}
                >
                  Reject
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MyItems() {
  const { user } = useAuth();
  const [showMessagesFor, setShowMessagesFor] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Wait for user context to load
  if (user === undefined) {
    return (
      <div className="container py-20 text-center">
        <div className="text-lg">Loading your account...</div>
      </div>
    );
  }

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

  // Get items the user has listed
  const { data: myListings, isLoading: myListingsLoading, error: myListingsError } = useQuery<Item[]>({
    queryKey: ["/api/my-items"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user
  });

  // Get rental requests where user is the requester (renting from others)
  const { data: myRentals, isLoading: myRentalsLoading, error: myRentalsError } = useQuery<RentalRequest[]>({
    queryKey: ["/api/my-rental-requests"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user
  });

  // Get items that the user owns and are currently being rented by others
  const { data: myItemsBeingRented, isLoading: myItemsBeingRentedLoading, error: myItemsBeingRentedError } = useQuery<RentalRequest[]>({
    queryKey: ["/api/my-items-being-rented"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user
  });

  // Add mutation for marking rental as complete
  const completeMutation = useMutation({
    mutationFn: (rental: RentalRequest) =>
      apiRequest("PATCH", `/api/rental-requests/${rental.id}/status`, { status: "completed" }),
    onSuccess: () => {
      // Refetch all queries to update the UI
      queryClient.invalidateQueries({ queryKey: ["/api/my-rental-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-items-being-rented"] });
    },
  });

  // Add mutation for reviewing rental requests
  const reviewMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: string }) =>
      apiRequest("POST", `/api/rental-requests/${id}/review`, { action }),
    onSuccess: () => {
      // Refetch queries to update the UI
      queryClient.invalidateQueries({ queryKey: ["/api/rental-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-items"] });
    },
  });

  if (myListingsError || myRentalsError || myItemsBeingRentedError) {
    return (
      <div className="container py-20 text-center text-red-600">
        Failed to load your items. Please try again later or contact support.
      </div>
    );
  }

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

      {/* Section 1: Items I have listed */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Package className="mr-2 h-6 w-6 text-primary" /> Items I have listed
        </h2>
        {myListingsLoading ? (
          <div className="text-center py-8">Loading your listings...</div>
        ) : Array.isArray(myListings) && myListings.filter((item: Item) => item.ownerId === user.id).length > 0 ? (
          (() => {
            try {
              const filteredListings = myListings.filter((item: Item) => item.ownerId === user.id);
              return (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {filteredListings.map((item: Item) => (
                    <div key={item.id} className="relative group">
                      <ItemCard item={item} />
                    </div>
                  ))}
                </div>
              );
            } catch (err) {
              console.error('Error rendering listed items:', err);
              return <div className="text-center text-red-600 py-8">Failed to load listed items</div>;
            }
          })()
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <Package className="h-10 w-10 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items listed yet</h3>
            <p className="text-gray-500 mb-4">
              You haven't uploaded any items yet. Start earning by listing your underused items for rent!
            </p>
            <Link href="/upload-item">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Upload Item
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Section 2: Items I’m renting */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <ShoppingCart className="mr-2 h-6 w-6 text-primary" /> Items I’m renting
        </h2>
        {myRentalsLoading ? (
          <div className="text-center py-8">Loading your rentals...</div>
        ) : Array.isArray(myRentals) && myRentals.length > 0 ? (
          (() => {
            try {
              // Prevent duplicate entries: Only show the most recent approved rental per item for the current user
              const uniqueRentalsMap = new Map();
              myRentals.forEach((rental: RentalRequest) => {
                if (rental.status === 'approved' && rental.item && rental.requesterId === user.id) {
                  const existing = uniqueRentalsMap.get(rental.itemId);
                  if (!existing || new Date(rental.updatedAt || rental.createdAt).getTime() > new Date(existing.updatedAt || existing.createdAt).getTime()) {
                    uniqueRentalsMap.set(rental.itemId, rental);
                  }
                }
              });
              const uniqueRentals = Array.from(uniqueRentalsMap.values());
              return (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {uniqueRentals.map((rental: RentalRequest) => {
                    const canMarkComplete =
                      (user.id === rental.requesterId && !rental.completedByBorrower) ||
                      (user.id === rental.owner?.id && !rental.completedByLender);
                    return (
                      <div key={rental.id} className="relative group border rounded p-4">
                        {/* Show item info clearly */}
                        <div className="mb-2">
                          <img src={rental.item?.imageData} alt={rental.item?.name} className="w-full h-32 object-cover rounded mb-2" />
                          <div className="font-bold">{rental.item?.name}</div>
                          <div className="text-sm text-gray-500">Owner: {rental.owner?.username}</div>
                          <div className="text-sm text-gray-500">Rental: {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}</div>
                        </div>
                        <Button size="sm" variant="outline" className="mb-2" onClick={() => navigate(`/messages?userId=${rental.owner?.id}&itemId=${rental.itemId}`)}>
                          <MessageSquare className="h-4 w-4 mr-1" /> Message Owner
                        </Button>
                        {/* Mark as Complete button for both roles */}
                        {canMarkComplete && (
                          <Button
                            size="sm"
                            className="mb-2"
                            onClick={() => completeMutation.mutate(rental)}
                            disabled={completeMutation.isPending}
                          >
                            Mark as Complete
                          </Button>
                        )}
                        {/* Show completion status */}
                        <div className="text-xs mt-2">
                          {rental.completedByLender && rental.completedByBorrower ? (
                            <span className="text-green-600 font-semibold">Rental fully completed</span>
                          ) : rental.completedByLender ? (
                            <span className="text-yellow-600">Owner marked complete, waiting for renter</span>
                          ) : rental.completedByBorrower ? (
                            <span className="text-yellow-600">Renter marked complete, waiting for owner</span>
                          ) : (
                            <span className="text-gray-500">Rental in progress</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            } catch (err) {
              console.error('Error rendering rented items:', err);
              return <div className="text-center text-red-600 py-8">Error rendering rented items</div>;
            }
          })()
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <ShoppingCart className="h-10 w-10 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">You haven’t rented any items yet</h3>
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
      </section>
      {/* In each rental request card for the lender, add a View Profile button for the requester */}
      <OwnerRentalRequests />

      {/* Section 3: My Items Being Rented (as owner) */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Package className="mr-2 h-6 w-6 text-primary" /> My Items Being Rented
        </h2>
        {myItemsBeingRentedLoading ? (
          <div className="text-center py-8">Loading items being rented...</div>
        ) : Array.isArray(myItemsBeingRented) && myItemsBeingRented.length > 0 ? (
          (() => {
            try {
              return (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {myItemsBeingRented.map((rental: RentalRequest) => {
                    const canMarkComplete = user.id === rental.item?.ownerId && !rental.completedByLender;
                    return (
                      <div key={rental.id} className="relative group border rounded p-4">
                        {/* Show item info clearly */}
                        <div className="mb-2">
                          <img src={rental.item?.imageData} alt={rental.item?.name} className="w-full h-32 object-cover rounded mb-2" />
                          <div className="font-bold">{rental.item?.name}</div>
                          <div className="text-sm text-gray-500">Rented by: {rental.requester?.username}</div>
                          <div className="text-sm text-gray-500">Rental: {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}</div>
                        </div>
                        <Button size="sm" variant="outline" className="mb-2" onClick={() => navigate(`/messages?userId=${rental.requester?.id}&itemId=${rental.itemId}`)}>
                          <MessageSquare className="h-4 w-4 mr-1" /> Message Renter
                        </Button>
                        {/* Mark as Complete button for owner */}
                        {canMarkComplete && (
                          <Button
                            size="sm"
                            className="mb-2"
                            onClick={() => completeMutation.mutate(rental)}
                            disabled={completeMutation.isPending}
                          >
                            Mark as Complete
                          </Button>
                        )}
                        {/* Show completion status */}
                        <div className="text-xs mt-2">
                          {rental.completedByLender && rental.completedByBorrower ? (
                            <span className="text-green-600 font-semibold">Rental fully completed</span>
                          ) : rental.completedByLender ? (
                            <span className="text-yellow-600">You marked complete, waiting for renter</span>
                          ) : rental.completedByBorrower ? (
                            <span className="text-yellow-600">Renter marked complete, waiting for you</span>
                          ) : (
                            <span className="text-gray-500">Rental in progress</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            } catch (err) {
              console.error('Error rendering items being rented:', err);
              return <div className="text-center text-red-600 py-8">Error rendering items being rented</div>;
            }
          })()
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <Package className="h-10 w-10 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items currently being rented</h3>
            <p className="text-gray-500 mb-4">
              When someone rents your items, they'll appear here for you to manage.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}