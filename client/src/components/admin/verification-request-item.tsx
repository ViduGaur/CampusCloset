import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface VerificationRequestItemProps {
  request: any;
  onApprove: () => void;
  onReject: () => void;
  onView: () => void;
}

export function VerificationRequestItem({
  request,
  onApprove,
  onReject,
  onView,
}: VerificationRequestItemProps) {
  const { user, createdAt } = request;
  
  // Format the created time
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <li>
      <div className="px-6 py-4 flex items-center">
        <div className="flex-shrink-0 h-12 w-12">
          <Avatar className="h-12 w-12">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.fullName}`} alt={user.fullName} />
            <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
            <p className="text-sm text-gray-500">Applied {timeAgo}</p>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span>{user.hostel}</span>
            <span className="mx-1">•</span>
            <span>{user.email}</span>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <Button
            variant="default"
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={onApprove}
          >
            <Check className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={onReject}
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="ml-2 h-8 w-8"
            onClick={onView}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}
