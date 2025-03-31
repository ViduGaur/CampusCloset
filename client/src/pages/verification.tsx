import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebcamCapture } from "@/components/webcam-capture";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Upload, Camera, AlertCircle } from "lucide-react";

export default function Verification() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("camera");
  const [idImage, setIdImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  // Redirect if user is already verified
  if (user?.isVerified) {
    navigate("/");
    return null;
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setIdImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle webcam capture
  const handleWebcamCapture = (file: File, imageUrl: string) => {
    setIdImage(file);
    setPreviewUrl(imageUrl);
    setActiveTab("preview");
  };

  // Reset the form
  const handleReset = () => {
    setIdImage(null);
    setPreviewUrl(null);
    setActiveTab("camera");
  };

  // Submit verification request
  const verificationMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      if (!idImage) {
        throw new Error("No ID image provided");
      }

      const formData = new FormData();
      formData.append("idImage", idImage);

      return apiRequest("POST", "/api/verification", formData);
    },
    onSuccess: () => {
      toast({
        title: "Verification Request Submitted",
        description: "Your ID has been submitted for verification. You'll be notified once it's approved.",
      });
      navigate("/verification-pending");
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "There was an error submitting your verification request. Please try again.",
        variant: "destructive",
      });
      setUploading(false);
    },
  });

  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Student ID Verification</CardTitle>
          <CardDescription>
            Verify your student status by uploading a photo of your college ID card
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Student ID verification information */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Why we verify student IDs</p>
                <p>Verification helps build trust within our community and ensures that only verified students can participate in renting items from each other.</p>
              </div>
            </div>
          </div>
          
          {previewUrl ? (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border shadow-sm max-w-md mx-auto">
                <img src={previewUrl} alt="ID Preview" className="w-full h-auto" />
              </div>
              
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={handleReset}>
                  Try Again
                </Button>
                <Button 
                  onClick={() => verificationMutation.mutate()}
                  disabled={verificationMutation.isPending || !idImage}
                >
                  {verificationMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit for Verification"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="camera">
                  <Camera className="mr-2 h-4 w-4" />
                  Take Photo
                </TabsTrigger>
                <TabsTrigger value="upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="camera" className="mt-4">
                <WebcamCapture 
                  onCapture={handleWebcamCapture}
                  onCancel={() => setActiveTab("upload")}
                />
              </TabsContent>
              
              <TabsContent value="upload" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-full max-w-md h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors p-4"
                        onClick={() => document.getElementById('id-upload')?.click()}
                      >
                        <Upload className="h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-700 font-medium">Click to upload your student ID</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG or JPEG (max. 5MB)</p>
                        
                        <input
                          id="id-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </div>
                      
                      <div className="mt-4 text-sm text-gray-500 text-center">
                        <p>Make sure your photo clearly shows:</p>
                        <ul className="mt-2 list-disc list-inside">
                          <li>Your full name</li>
                          <li>College/University name</li>
                          <li>Student ID number</li>
                          <li>Your photo (if present on ID)</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center text-sm text-gray-500">
          Your ID will only be used for verification and won't be publicly visible
        </CardFooter>
      </Card>
    </div>
  );
}