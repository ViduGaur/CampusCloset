import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, ArrowLeft } from "lucide-react";

export default function VerificationPending() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Redirect verified users to homepage
  if (user?.isVerified) {
    navigate("/");
    return null;
  }

  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-10 w-10 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Verification In Progress</CardTitle>
          <CardDescription>
            Your student ID has been submitted and is pending approval
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Thanks for submitting your college ID for verification. Our team will review your submission as soon as possible.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-8 mt-8">
            <div className="flex-1 p-6 border rounded-lg">
              <div className="flex justify-center mb-4">
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="font-medium text-lg mb-2">Current Status</h3>
              <p className="text-sm text-gray-600">
                Your verification is being reviewed by our team
              </p>
            </div>
            
            <div className="flex-1 p-6 border rounded-lg">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="font-medium text-lg mb-2">Next Steps</h3>
              <p className="text-sm text-gray-600">
                Once approved, you'll be able to list items for rent and interact with other verified students
              </p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-blue-700">
              Verification typically takes 1-2 business days. You'll receive a notification when your verification is complete.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Homepage
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}