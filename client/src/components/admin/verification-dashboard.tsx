import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerificationRequestItem } from "./verification-request-item";
import { VerificationModal } from "./verification-modal";
import { apiRequest } from "@/lib/queryClient";
import { Filter, SortDesc } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function VerificationDashboard() {
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingRequests, isLoading } = useQuery({
    queryKey: ["/api/admin/verification/pending"],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      return apiRequest("POST", `/api/admin/verification/${id}/review`, { 
        action: "approve",
        notes 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verification/pending"] });
      setIsModalOpen(false);
      setSelectedRequest(null);
      toast({
        title: "Success",
        description: "Verification request approved",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve request",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      return apiRequest("POST", `/api/admin/verification/${id}/review`, { 
        action: "reject",
        notes 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verification/pending"] });
      setIsModalOpen(false);
      setSelectedRequest(null);
      toast({
        title: "Success",
        description: "Verification request rejected",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject request",
        variant: "destructive",
      });
    },
  });

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleApprove = (id: number, notes?: string) => {
    approveMutation.mutate({ id, notes });
  };

  const handleReject = (id: number, notes?: string) => {
    rejectMutation.mutate({ id, notes });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  return (
    <div className="flex-1">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Verification Requests
        </h2>
        <div className="inline-flex shadow-sm rounded-md">
          <Button variant="outline" className="rounded-r-none">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" className="rounded-l-none">
            <SortDesc className="h-4 w-4 mr-2" />
            Sort
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-6">Loading verification requests...</div>
          ) : pendingRequests && pendingRequests.length > 0 ? (
            <div className="overflow-hidden bg-white shadow-sm rounded-lg">
              <ul className="divide-y divide-gray-200">
                {pendingRequests.map((request: any) => (
                  <VerificationRequestItem
                    key={request.id}
                    request={request}
                    onApprove={() => handleApprove(request.id)}
                    onReject={() => handleReject(request.id)}
                    onView={() => handleViewRequest(request)}
                  />
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-6 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500">No pending verification requests</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved">
          <div className="text-center py-6 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">Approved requests will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="rejected">
          <div className="text-center py-6 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">Rejected requests will appear here</p>
          </div>
        </TabsContent>
      </Tabs>

      {selectedRequest && (
        <VerificationModal
          request={selectedRequest}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onApprove={(notes) => handleApprove(selectedRequest.id, notes)}
          onReject={(notes) => handleReject(selectedRequest.id, notes)}
        />
      )}
    </div>
  );
}
