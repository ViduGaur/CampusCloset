import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  
  const { user, idImageData, createdAt } = request;
  const uploadDate = format(new Date(createdAt), "MMMM d, yyyy 'at' h:mm a");

  const handleApprove = () => {
    onApprove(notes);
  };

  const handleReject = () => {
    onReject(notes);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Verification Request Details</DialogTitle>
          <DialogDescription>
            Review the student ID details before approving or rejecting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.fullName}`}
                alt={user.fullName}
              />
              <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Student ID</h4>
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={`data:image/jpeg;base64,${idImageData}`}
                alt="Student ID"
                className="w-full object-cover h-48"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Uploaded on {uploadDate}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <p className="text-sm text-gray-500">Hostel/Dorm</p>
              <p className="text-sm text-gray-900">{user.hostel}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm text-gray-500">Username</p>
              <p className="text-sm text-gray-900">{user.username}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <Textarea
              placeholder="Add any notes about this verification"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            onClick={handleApprove}
          >
            Approve
          </Button>
          <Button variant="outline" onClick={handleReject}>
            Reject
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
