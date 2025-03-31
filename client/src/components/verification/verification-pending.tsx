import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Clock } from "lucide-react";

export function VerificationPendingView() {
  const [, navigate] = useLocation();

  const handleReturnToHome = () => {
    navigate("/");
  };

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
        <Clock className="h-8 w-8 text-yellow-600" />
      </div>
      <h2 className="mt-3 text-lg font-medium text-gray-900">
        Verification in Progress
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        We've received your student ID and our team is reviewing it. This
        typically takes 1-2 business days.
      </p>
      <div className="mt-6 flex justify-center">
        <Button onClick={handleReturnToHome}>
          Return to Home
        </Button>
      </div>
    </div>
  );
}
