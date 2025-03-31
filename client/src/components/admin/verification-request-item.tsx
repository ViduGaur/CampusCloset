import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle, XCircle, Eye } from "lucide-react";

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
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-5 gap-4">
          {/* User info */}
          <div className="col-span-3">
            <h3 className="text-lg font-medium flex items-center">
              {request.user.fullName}
              <Badge 
                variant="outline" 
                className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
              >
                Pending
              </Badge>
            </h3>
            <div className="space-y-1 mt-2">
              <p className="text-sm text-gray-500">
                <span className="font-medium">Username:</span> {request.user.username}
              </p>
              <p className="text-sm text-gray-500">
                <span className="font-medium">Email:</span> {request.user.email}
              </p>
              <p className="text-sm text-gray-500">
                <span className="font-medium">Hostel:</span> {request.user.hostel}
              </p>
              <p className="text-sm text-gray-500">
                <span className="font-medium">Submitted:</span> {formatDate(request.createdAt)}
              </p>
            </div>
          </div>
          
          {/* ID preview (small thumbnail) */}
          <div className="col-span-2">
            <div 
              className="relative w-full h-40 rounded-md bg-gray-100 flex items-center justify-center cursor-pointer group overflow-hidden"
              onClick={onView}
            >
              {request.idImageData ? (
                <>
                  <img 
                    src={`data:image/jpeg;base64,${request.idImageData}`} 
                    alt="ID preview" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="h-8 w-8 text-white" />
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">No image</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-2 bg-gray-50 border-t">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          onClick={onReject}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Reject
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
          onClick={onApprove}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Approve
        </Button>
      </CardFooter>
    </Card>
  );
}