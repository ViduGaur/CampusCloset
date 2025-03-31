import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { VerificationPendingView } from "@/components/verification/verification-pending";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function VerificationPending() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect if not logged in or already verified
  useEffect(() => {
    if (!user) {
      navigate("/register");
    } else if (user.isVerified) {
      navigate("/");
    }
  }, [user, navigate]);
  
  if (!user) return null; // Don't render until auth check completes
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-4 py-8">
        <VerificationPendingView />
      </div>
      
      <Footer />
    </div>
  );
}
