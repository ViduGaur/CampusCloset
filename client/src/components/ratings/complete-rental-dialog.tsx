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

interface CompleteRentalDialogProps {
  children: ReactNode;
  rentalRequestId: number;
  otherUserId: number;
}

export function CompleteRentalDialog({
  children,
  rentalRequestId,
  otherUserId,
}: CompleteRentalDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      return apiRequest(
        "PATCH",
        `/api/rental-requests/${rentalRequestId}/complete`,
        {}
      );
    },
    onSuccess: () => {
      toast({
        title: "Rental marked as completed",
        description: "The rental has been marked as completed.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/my-rental-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-items/rental-requests"] });
      
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete the rental. Please try again.",
        variant: "destructive",
      });
      console.error("Error completing rental:", error);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Rental</DialogTitle>
          <DialogDescription>
            Are you sure you want to mark this rental as complete?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-500">
            By completing this rental, you're confirming that:
          </p>
          <ul className="list-disc pl-5 mt-2 text-sm text-gray-500 space-y-1">
            <li>The rental period has ended</li>
            <li>The item has been returned (if you're the lender)</li>
            <li>You've returned the item (if you're the borrower)</li>
          </ul>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Completing..." : "Complete Rental"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}