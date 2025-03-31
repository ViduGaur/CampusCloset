import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { RegistrationForm } from "@/components/verification/registration-form";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Register() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-4 py-8">
        <RegistrationForm />
      </div>
      
      <Footer />
    </div>
  );
}
