import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, RotateCcw } from "lucide-react";

interface WebcamCaptureProps {
  onCapture: (file: File, previewUrl: string) => void;
  onCancel: () => void;
}

export function WebcamCapture({ onCapture, onCancel }: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setCapturedImage(null);
  };

  const saveCapture = () => {
    if (capturedImage) {
      // Convert base64 to blob
      const byteString = atob(capturedImage.split(',')[1]);
      const mimeString = capturedImage.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([ab], { type: mimeString });
      const file = new File([blob], "captured-image.jpg", { type: "image/jpeg" });
      
      onCapture(file, capturedImage);
    }
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col items-center">
          {!capturedImage ? (
            <>
              <div className="relative w-full max-w-md rounded-lg overflow-hidden mb-4">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={capture} className="flex items-center">
                  <Camera className="mr-2 h-4 w-4" />
                  Capture
                </Button>
                <Button variant="outline" onClick={onCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-full max-w-md rounded-lg overflow-hidden mb-4">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={saveCapture}>Use Photo</Button>
                <Button variant="outline" onClick={retake}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retake
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
