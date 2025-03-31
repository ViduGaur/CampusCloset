import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { User, IdCard, Check, Camera, Upload } from "lucide-react";
import { WebcamCapture } from "@/components/webcam-capture";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function VerificationForm() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const steps = [
    { label: "Account", icon: <User className="h-4 w-4" /> },
    { label: "Verification", icon: <IdCard className="h-4 w-4" /> },
    { label: "Complete", icon: <Check className="h-4 w-4" /> },
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviewUrl(e.target.result as string);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleCaptureFromWebcam = (capturedFile: File, previewSrc: string) => {
    setFile(capturedFile);
    setPreviewUrl(previewSrc);
    setShowCamera(false);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const droppedFile = event.dataTransfer.files[0];
      setFile(droppedFile);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviewUrl(e.target.result as string);
        }
      };
      reader.readAsDataURL(droppedFile);
    }
  };

  const handleSubmitVerification = async () => {
    if (!file) {
      toast({
        title: "No image selected",
        description: "Please upload or capture an image of your college ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("idImage", file);

      const res = await fetch("/api/verification", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          "user-id": user.id.toString(), // For demonstration, typically handled by a proper auth middleware
        },
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${await res.text()}`);
      }

      toast({
        title: "Verification request submitted",
        description: "We'll review your ID shortly",
      });

      navigate("/verification-pending");
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate("/");
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">
          Verify Your Student ID
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          We need to verify you're a student at your university
        </p>
      </div>

      <ProgressSteps currentStep={1} steps={steps} />

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Upload Your College ID
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Please upload a clear photo of your college ID card. We'll keep
              your information secure.
            </p>
          </div>

          {showCamera ? (
            <WebcamCapture onCapture={handleCaptureFromWebcam} onCancel={() => setShowCamera(false)} />
          ) : (
            <div
              className={`border-2 border-dashed ${
                previewUrl ? "border-primary" : "border-gray-300"
              } rounded-lg p-6 text-center`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="ID Preview"
                    className="mx-auto max-h-48 rounded-lg"
                  />
                  <div className="flex justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl(null);
                      }}
                    >
                      Remove
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto flex justify-center">
                    <Upload className="h-10 w-10 text-gray-400" />
                  </div>
                  <div className="text-sm text-gray-600 flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mx-auto"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload a photo
                    </Button>
                    <span className="text-gray-500">or</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mx-auto"
                      onClick={() => setShowCamera(true)}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Take a photo
                    </Button>
                    <span className="text-gray-500">or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="sr-only"
                accept="image/*"
              />
            </div>
          )}

          <div className="bg-yellow-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Privacy Notice
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Your ID will only be used to verify your student status and
                    will be reviewed by our team. We do not store your ID
                    permanently.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              className="w-full"
              onClick={() => setShowConfirmDialog(true)}
              disabled={!file || isLoading}
            >
              {isLoading ? "Submitting..." : "Submit for Verification"}
            </Button>
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={handleGoBack}
              disabled={isLoading}
            >
              Back
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit this ID for verification? Please make sure the image is clear and shows all necessary information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitVerification}>
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
