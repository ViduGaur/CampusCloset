import { ReactNode, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";

interface CompleteRentalDialogProps {
  children: ReactNode;
  rentalRequestId: number;
  otherUserId: number;
}

export function CompleteRentalDialog({ rentalRequest, onStatusChange }: { rentalRequest: any, onStatusChange?: () => void }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [showRating, setShowRating] = useState(false);

  // Mark as completed mutation
  const completeMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/rental-requests/${rentalRequest.id}/status`, { status: "completed" }),
    onSuccess: () => onStatusChange && onStatusChange(),
  });

  // Submit rating mutation
  const ratingMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/rental-ratings", {
      rentalRequestId: rentalRequest.id,
      rating,
      comment,
    }),
    onSuccess: () => setShowRating(false),
  });

  // Check if user can mark as completed
  const isLender = user && rentalRequest.item?.ownerId === user.id;
  const isBorrower = user && rentalRequest.requesterId === user.id;
  const hasLenderCompleted = rentalRequest.completedByLender;
  const hasBorrowerCompleted = rentalRequest.completedByBorrower;

  // Only show complete button if user is party and hasn't completed
  const canMarkCompleted = (isLender && !hasLenderCompleted) || (isBorrower && !hasBorrowerCompleted);
  // Only show rating if both completed, user is lender, and not already rated
  const canRate = isLender && hasLenderCompleted && hasBorrowerCompleted && !rentalRequest.hasRated;

  return (
    <div>
      {canMarkCompleted && (
        <button onClick={() => completeMutation.mutate()} disabled={completeMutation.isLoading}>
          Mark as Completed
        </button>
      )}
      {canRate && (
        <div>
          <button onClick={() => setShowRating(true)}>Rate Borrower</button>
          {showRating && (
            <form onSubmit={e => { e.preventDefault(); ratingMutation.mutate(); }}>
              <label>Rating (1-5):
                <input type="number" min={1} max={5} value={rating} onChange={e => setRating(Number(e.target.value))} />
              </label>
              <label>Comment:
                <input type="text" value={comment} onChange={e => setComment(e.target.value)} />
              </label>
              <button type="submit" disabled={ratingMutation.isLoading}>Submit Rating</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}