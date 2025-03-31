import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RatingForm } from "@/components/ratings/rating-form";
import { ClipboardCheck, Star } from "lucide-react";

interface CompleteRentalDialogProps {
  rentalRequestId: number;
  otherUserId: number;
  children?: React.ReactNode;
}

export function CompleteRentalDialog({ 
  rentalRequestId, 
  otherUserId, 
  children 
}: CompleteRentalDialogProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation to mark rental as complete
  const completeRentalMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/rental-requests/${rentalRequestId}/status`, {
        status: "completed"
      });
    },
    onSuccess: () => {
      toast({
        title: "Rental completed!",
        description: "The rental has been marked as completed.",
      });
      
      setIsCompleted(true);
      setShowRatingForm(true);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/my-rental-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-items/rental-requests"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to complete rental",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleCompleteRental = () => {
    completeRentalMutation.mutate();
  };

  const handleRatingSuccess = () => {
    setShowRatingForm(false);
    setShowDialog(false);
    
    toast({
      title: "Rating submitted",
      description: "Thank you for your feedback!",
    });
  };

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          {children || (
            <Button variant="outline" size="sm" className="ml-auto">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Complete Rental
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          {!isCompleted ? (
            <>
              <DialogHeader>
                <DialogTitle>Complete Rental</DialogTitle>
                <DialogDescription>
                  Are you sure you want to mark this rental as completed? 
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCompleteRental}
                  disabled={completeRentalMutation.isPending}
                >
                  {completeRentalMutation.isPending ? "Processing..." : "Complete Rental"}
                </Button>
              </div>
            </>
          ) : (
            showRatingForm && (
              <RatingForm 
                toUserId={otherUserId} 
                rentalRequestId={rentalRequestId}
                onSuccess={handleRatingSuccess}
                onCancel={() => setShowDialog(false)}
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}