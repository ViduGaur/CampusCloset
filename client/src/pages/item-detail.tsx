import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar,
  ChevronLeft,
  MessageSquare,
  MapPin,
  User,
  DollarSign,
  Loader2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

// Define the expected shape of the item
interface ItemOwner {
  id: number;
  username: string;
  fullName?: string;
  hostel: string;
}

interface ItemDetail {
  id: number;
  name: string;
  description: string;
  size: string;
  pricePerDay: number;
  imageData: string;
  ownerId: number;
  isAvailable: boolean;
  createdAt: string;
  owner: ItemOwner;
}

export default function ItemDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [rentalDates, setRentalDates] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [isSubmittingRental, setIsSubmittingRental] = useState(false);
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);

  // Fetch item details
  const { data: item, isLoading, error } = useQuery<ItemDetail>({
    queryKey: [`/api/items/${id}`],
    enabled: !!id,
  });

  const handleRequestRental = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to request rentals",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!user.isVerified) {
      toast({
        title: "Verification required",
        description: "Your account needs to be verified before you can request rentals",
        variant: "destructive",
      });
      navigate("/verification");
      return;
    }

    if (!rentalDates.from || !rentalDates.to) {
      toast({
        title: "Date selection required",
        description: "Please select both start and end dates for your rental",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingRental(true);

    try {
      const response = await fetch("/api/rental-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": user.id.toString(),
        },
        body: JSON.stringify({
          itemId: parseInt(id as string),
          startDate: rentalDates.from.toISOString(),
          endDate: rentalDates.to.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit rental request");
      }

      toast({
        title: "Request submitted",
        description: "Your rental request has been sent to the owner",
      });
      setIsRentalModalOpen(false);
    } catch (error) {
      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : "Failed to submit rental request",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingRental(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to send messages",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!item) {
      toast({
        title: "Error",
        description: "Item information is not available",
        variant: "destructive",
      });
      return;
    }

    if (!messageText.trim()) {
      toast({
        title: "Empty message",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingMessage(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": user.id.toString(),
        },
        body: JSON.stringify({
          fromUserId: user.id,
          toUserId: item.owner.id,
          content: messageText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      toast({
        title: "Message sent",
        description: "Your message has been sent to the owner",
      });
      setMessageText("");
      setIsMessageModalOpen(false);
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "An error occurred while sending your message",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  // Format the price - convert from cents to dollars
  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Back button */}
          <div className="mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to items
            </Button>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Skeleton className="h-96 w-full rounded-md" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-red-500">Error loading item. Please try again later.</p>
            </div>
          ) : item ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Item Image */}
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={item.imageData.startsWith('data:') 
                    ? item.imageData 
                    : `data:image/jpeg;base64,${item.imageData}`}
                  alt={item.name}
                  className="w-full h-full object-center object-cover"
                />
              </div>
              
              {/* Item Details */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
                  <p className="mt-1 text-xl font-semibold text-primary">
                    {formatPrice(item.pricePerDay)}/day
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="px-3 py-1">
                    Size: {item.size}
                  </Badge>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    <p>{item.owner.hostel}</p>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-sm font-medium text-gray-900">Description</h2>
                  <p className="mt-2 text-sm text-gray-500">{item.description}</p>
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {item.owner.fullName || item.owner.username}
                      </p>
                      <Link href={`/profile/${item.owner.id}`}>
                        <a className="text-xs text-primary hover:underline">
                          View profile
                        </a>
                      </Link>
                    </div>
                  </div>
                </div>
                
                {user && user.id !== item.owner.id ? (
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                    <Button 
                      className="flex-1"
                      onClick={() => setIsRentalModalOpen(true)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Request to Rent
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setIsMessageModalOpen(true)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Owner
                    </Button>
                  </div>
                ) : !user ? (
                  <div className="pt-4">
                    <Button 
                      className="w-full"
                      onClick={() => navigate("/login")}
                    >
                      Sign in to request or message
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      
      <Footer />
      
      {/* Rental Request Modal */}
      <Dialog open={isRentalModalOpen} onOpenChange={setIsRentalModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request Rental</DialogTitle>
            <DialogDescription>
              Select dates for your rental request. The owner will need to approve your request.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">Price per day:</div>
                <div className="font-semibold text-primary">
                  {item ? formatPrice(item.pricePerDay) : "$0.00"}
                </div>
              </div>
              
              {rentalDates.from && rentalDates.to && (
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">Total for {
                    Math.max(1, Math.ceil((rentalDates.to.getTime() - rentalDates.from.getTime()) / (1000 * 60 * 60 * 24)))
                  } days:</div>
                  <div className="font-semibold text-primary">
                    {item ? formatPrice(
                      item.pricePerDay * Math.max(1, Math.ceil((rentalDates.to.getTime() - rentalDates.from.getTime()) / (1000 * 60 * 60 * 24)))
                    ) : "$0.00"}
                  </div>
                </div>
              )}
              
              <div className="border rounded-md p-4 mt-4">
                <div className="flex flex-col space-y-2">
                  <h4 className="text-sm font-medium">Select Dates</h4>
                  <div className="grid gap-2">
                    <CalendarComponent
                      mode="range"
                      selected={{
                        from: rentalDates.from,
                        to: rentalDates.to,
                      }}
                      onSelect={(range) => setRentalDates({
                        from: range?.from,
                        to: range?.to,
                      })}
                      disabled={{ before: new Date() }}
                      numberOfMonths={1}
                      className="rounded-md border"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <div>
                      <span className="font-medium">From:</span>{" "}
                      {rentalDates.from ? format(rentalDates.from, "PPP") : "Not selected"}
                    </div>
                    <div>
                      <span className="font-medium">To:</span>{" "}
                      {rentalDates.to ? format(rentalDates.to, "PPP") : "Not selected"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRentalModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRequestRental}
              disabled={isSubmittingRental || !rentalDates.from || !rentalDates.to}
            >
              {isSubmittingRental && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Message Modal */}
      <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Message the Owner</DialogTitle>
            <DialogDescription>
              Send a message to the owner about this item.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Hi, I'm interested in renting this item. Is it still available?"
              className="min-h-[120px]"
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsMessageModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={isSubmittingMessage || !messageText.trim()}
            >
              {isSubmittingMessage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}