import { useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { ItemUploadForm } from "@/components/upload/item-upload-form";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function ItemUpload() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Redirect if not logged in or not verified
  useEffect(() => {
    if (!user) {
      navigate("/login");
      toast({
        title: "Please log in",
        description: "You need to be logged in to upload items",
        variant: "destructive",
      });
    } else if (!user.isVerified) {
      navigate("/verification");
      toast({
        title: "Verification required",
        description: "Your account needs to be verified before you can upload items",
        variant: "destructive",
      });
    }
  }, [user, navigate, toast]);
  
  if (!user || !user.isVerified) return null; // Don't render until auth check completes
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-4 py-8">
        <ItemUploadForm />
      </div>
      
      <Footer />
    </div>
  );
}
