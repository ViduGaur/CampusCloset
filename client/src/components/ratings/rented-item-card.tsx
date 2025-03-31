import { useState } from "react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompleteRentalDialog } from "@/components/ratings/complete-rental-dialog";
import { ArrowRightCircle, Clock, User } from "lucide-react";

interface RentedItemCardProps {
  rental: any;
  type: "rented" | "lending";
}

export function RentedItemCard({ rental, type }: RentedItemCardProps) {
  const isRented = type === "rented"; // User renting from someone else
  const isLending = type === "lending"; // User lending to someone else
  
  const item = rental.item;
  
  // For rented items, the owner is the other party
  // For lending items, the requester is the other party
  const otherPartyId = isRented ? item.ownerId : rental.requesterId;
  const otherParty = isRented ? rental.owner : rental.requester;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "approved":
        return "Active";
      case "completed":
        return "Completed";
      case "rejected":
        return "Declined";
      default:
        return status;
    }
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={item.imageData} 
          alt={item.name} 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-semibold truncate">
              {item.name}
            </CardTitle>
            <Badge className={getStatusColor(rental.status)}>
              {getStatusText(rental.status)}
            </Badge>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <Clock className="h-4 w-4 mr-1" />
            <span>
              {formatDistanceToNow(new Date(rental.createdAt), { addSuffix: true })}
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${otherParty?.fullName || "User"}`} 
                alt={otherParty?.fullName || "User"} 
              />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">
                {isRented ? 'Owner:' : 'Renter:'} {otherParty?.fullName || 'Unknown'}
              </div>
              <div className="text-xs text-gray-500">
                {otherParty?.hostel || ''}
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 line-clamp-2">
            {item.description || "No description provided"}
          </p>
        </CardContent>
        
        <CardFooter className="pt-2 flex justify-between gap-2">
          <Link href={`/items/${item.id}`}>
            <Button variant="outline" size="sm">
              View Item
            </Button>
          </Link>
          
          {rental.status === "approved" && (
            <CompleteRentalDialog
              rentalRequestId={rental.id}
              otherUserId={otherPartyId}
            >
              <Button size="sm">
                Complete
              </Button>
            </CompleteRentalDialog>
          )}
          
          {rental.status === "completed" && !rental.userHasRated && (
            <Link href={`/profile/${otherPartyId}?rate=true&rental=${rental.id}`}>
              <Button variant="outline" size="sm">
                Rate User
              </Button>
            </Link>
          )}
          
          {rental.status === "completed" && rental.userHasRated && (
            <Link href={`/profile/${otherPartyId}`}>
              <Button variant="outline" size="sm">
                View Profile
              </Button>
            </Link>
          )}
        </CardFooter>
      </div>
    </Card>
  );
}