import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VerificationRequestItem } from "./verification-request-item";
import { VerificationModal } from "./verification-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, UserCheck } from "lucide-react";

export function VerificationDashboard() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch pending verification requests
  const { data: pendingRequests = [], isLoading, isError } = useQuery({
    queryKey: ['/api/admin/verification/pending'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: completedRequests = [] } = useQuery({
    queryKey: ['/api/admin/verification/completed'],
  });

  // Handle approve verification request
  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number, notes?: string }) => {
      return apiRequest("POST", `/api/admin/verification/${id}/review`, { 
        action: "approve", 
        notes 
      });
    },
    onSuccess: () => {
      toast({
        title: "Verification Approved",
        description: "Student has been successfully verified",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verification/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verification/completed'] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve verification",
        variant: "destructive",
      });
    },
  });

  // Handle reject verification request
  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number, notes?: string }) => {
      return apiRequest("POST", `/api/admin/verification/${id}/review`, {
        action: "reject", 
        notes
      });
    },
    onSuccess: () => {
      toast({
        title: "Verification Rejected",
        description: "Student verification has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verification/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verification/completed'] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject verification",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (notes?: string) => {
    if (selectedRequest) {
      approveMutation.mutate({
        id: selectedRequest.id,
        notes,
      });
    }
  };

  const handleReject = (notes?: string) => {
    if (selectedRequest) {
      rejectMutation.mutate({
        id: selectedRequest.id,
        notes,
      });
    }
  };

  const openModal = (request: any) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const renderPendingRequests = () => {
    if (isLoading) {
      return <div className="py-8 text-center text-gray-500">Loading pending requests...</div>;
    }

    if (isError) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load verification requests. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      );
    }

    if (pendingRequests.length === 0) {
      return (
        <div className="py-8 text-center">
          <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">No pending verification requests</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {pendingRequests.map((request: any) => (
          <VerificationRequestItem
            key={request.id}
            request={request}
            onApprove={() => openModal(request)}
            onReject={() => openModal(request)}
            onView={() => openModal(request)}
          />
        ))}
      </div>
    );
  };

  const renderCompletedRequests = () => {
    if (completedRequests.length === 0) {
      return (
        <div className="py-8 text-center">
          <p className="text-gray-500">No completed verifications</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {completedRequests.map((request: any) => (
          <div 
            key={request.id} 
            className="p-4 border rounded-lg"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{request.user.fullName}</h3>
                <p className="text-sm text-gray-500">{request.user.email}</p>
              </div>
              <div className={`text-sm px-2 py-1 rounded ${
                request.status === 'approved' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {request.status === 'approved' ? 'Approved' : 'Rejected'}
              </div>
            </div>
            {request.notes && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                <p className="font-medium text-xs text-gray-500 mb-1">Notes:</p>
                {request.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <TabsContent value="pending" className="mt-6">
        {renderPendingRequests()}
      </TabsContent>
      
      <TabsContent value="completed" className="mt-6">
        {renderCompletedRequests()}
      </TabsContent>
      
      <VerificationModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={closeModal}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}