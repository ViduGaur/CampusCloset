import { useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { VerificationDashboard } from "@/components/admin/verification-dashboard";
import { Button } from "@/components/ui/button";
import { Shirt, Users, Settings } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Redirect if not admin
  useEffect(() => {
    if (!user) {
      navigate("/login");
      toast({
        title: "Access denied",
        description: "Please log in first",
        variant: "destructive",
      });
    } else if (!user.isAdmin) {
      navigate("/");
      toast({
        title: "Access denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
    }
  }, [user, navigate, toast]);
  
  if (!user || !user.isAdmin) return null; // Don't render until auth check completes
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row">
          {/* Admin Sidebar */}
          <div className="w-full lg:w-64 lg:flex-shrink-0 bg-white p-4 shadow-sm rounded-lg lg:mr-8 mb-6 lg:mb-0">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Admin Dashboard
                </h3>
                <nav className="mt-4 space-y-2">
                  <Button
                    variant="default"
                    className="w-full justify-start"
                  >
                    <Shirt className="mr-3 h-4 w-4" />
                    <span>Verification Requests</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <Users className="mr-3 h-4 w-4 text-gray-400" />
                    <span>Users</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <Shirt className="mr-3 h-4 w-4 text-gray-400" />
                    <span>Items</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <Settings className="mr-3 h-4 w-4 text-gray-400" />
                    <span>Settings</span>
                  </Button>
                </nav>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Statistics
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500">Pending</p>
                    <p className="text-lg font-semibold">-</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500">Today</p>
                    <p className="text-lg font-semibold">-</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <VerificationDashboard />
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
