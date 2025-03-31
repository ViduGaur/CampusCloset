import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerificationDashboard } from "@/components/admin/verification-dashboard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Users, Package } from "lucide-react";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Redirect to homepage if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="container py-10 max-w-7xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-500">
          Manage verification requests and system data
        </p>
      </div>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Verifications</p>
                <h3 className="text-2xl font-bold">2</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <h3 className="text-2xl font-bold">12</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Active Listings</p>
                <h3 className="text-2xl font-bold">8</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Verification Management */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Verification Management</CardTitle>
          <CardDescription>
            Review and manage student ID verification requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <VerificationDashboard />
          </Tabs>
        </CardContent>
      </Card>
      
      {/* System Management (mock-up for future implementation) */}
      <Card>
        <CardHeader>
          <CardTitle>System Management</CardTitle>
          <CardDescription>
            Manage categories, users, and system settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Categories</h3>
              <p className="text-sm text-gray-500 mb-4">Manage item categories in the system</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 border rounded-md text-sm">Ethnic Wear</div>
                <div className="p-3 border rounded-md text-sm">Formal Wear</div>
                <div className="p-3 border rounded-md text-sm">Casual Wear</div>
                <div className="p-3 border rounded-md text-sm">Accessories</div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-2">User Management</h3>
              <p className="text-sm text-gray-500 mb-4">View and manage user accounts</p>
              <div className="border rounded-md overflow-hidden">
                <div className="p-3 bg-gray-50 border-b grid grid-cols-4 text-sm font-medium">
                  <div>Username</div>
                  <div>Email</div>
                  <div>Hostel</div>
                  <div>Status</div>
                </div>
                <div className="p-3 border-b grid grid-cols-4 text-sm">
                  <div>john_doe</div>
                  <div className="truncate">john.doe@example.com</div>
                  <div>HB4</div>
                  <div><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Verified</span></div>
                </div>
                <div className="p-3 border-b grid grid-cols-4 text-sm">
                  <div>sara_smith</div>
                  <div className="truncate">sara.smith@example.com</div>
                  <div>HB1</div>
                  <div><span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">Pending</span></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}