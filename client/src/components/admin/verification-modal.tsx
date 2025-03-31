import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface VerificationModalProps {
  request: any;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (notes?: string) => void;
  onReject: (notes?: string) => void;
}

export function VerificationModal({
  request,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: VerificationModalProps) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const handleAction = async (actionType: "approve" | "reject") => {
    setIsSubmitting(true);
    setAction(actionType);
    
    try {
      if (actionType === "approve") {
        await onApprove(notes || undefined);
      } else {
        await onReject(notes || undefined);
      }
    } finally {
      setIsSubmitting(false);
      setAction(null);
      setNotes("");
    }
  };

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verification Request</DialogTitle>
          <DialogDescription>
            Review this student's ID verification request
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {/* Student Info */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Student Information</h3>
              <div className="space-y-2">
                <p className="text-sm"><span className="font-medium text-gray-700">Full Name:</span> {request.user?.fullName}</p>
                <p className="text-sm"><span className="font-medium text-gray-700">Username:</span> {request.user?.username}</p>
                <p className="text-sm"><span className="font-medium text-gray-700">Email:</span> {request.user?.email}</p>
                <p className="text-sm"><span className="font-medium text-gray-700">Hostel:</span> {request.user?.hostel}</p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Submitted:</span> {
                    new Date(request.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    })
                  }
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Verification Notes</h3>
              <Textarea
                placeholder="Add notes about this verification (optional)"
                className="min-h-[100px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          {/* ID Image */}
          <div className="border rounded-lg overflow-hidden mb-6">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="font-medium">Student ID Image</h3>
            </div>
            <div className="p-4 flex justify-center">
              {request.idImageData ? (
                <img 
                  src={`data:image/jpeg;base64,${request.idImageData}`} 
                  alt="Student ID" 
                  className="max-w-full max-h-[400px] object-contain border"
                />
              ) : (
                <div className="p-8 text-gray-500">No image available</div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => handleAction("reject")}
              disabled={isSubmitting}
            >
              {isSubmitting && action === "reject" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Verification
            </Button>
            
            <Button 
              variant="outline"
              className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={() => handleAction("approve")}
              disabled={isSubmitting}
            >
              {isSubmitting && action === "approve" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve Verification
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}