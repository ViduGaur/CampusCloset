import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { VerificationForm } from "@/components/verification/verification-form";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Verification() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Redirect if not logged in or already verified
  useEffect(() => {
    if (!user) {
      navigate("/register");
      toast({
        title: "Please register first",
        description: "You need to create an account before verification",
      });
    } else if (user.isVerified) {
      navigate("/");
      toast({
        title: "Already verified",
        description: "Your account is already verified",
      });
    }
  }, [user, navigate, toast]);
  
  // Check if user already has a pending verification request
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (user) {
        try {
          const res = await fetch("/api/verification/status", {
            credentials: "include",
            headers: {
              "user-id": user.id.toString(), // For demonstration
            }
          });
          
          if (res.ok) {
            const verificationData = await res.json();
            if (verificationData.status === "pending") {
              navigate("/verification-pending");
            }
          }
        } catch (error) {
          console.error("Error checking verification status:", error);
        }
      }
    };
    
    checkVerificationStatus();
  }, [user, navigate]);
  
  if (!user) return null; // Don't render until auth check completes
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-4 py-8">
        <VerificationForm />
      </div>
      
      <Footer />
    </div>
  );
}
