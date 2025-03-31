import { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, RefreshCw, Upload } from 'lucide-react';

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

  const retake = useCallback(() => {
    setCapturedImage(null);
  }, []);

  const saveCapture = useCallback(() => {
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
      const file = new File([blob], "webcam-capture.jpg", { type: "image/jpeg" });
      
      onCapture(file, capturedImage);
    }
  }, [capturedImage, onCapture]);

  const videoConstraints = {
    width: 720,
    height: 480,
    facingMode: "user"
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-sm border">
            {capturedImage ? (
              <img 
                src={capturedImage} 
                alt="Captured ID" 
                className="w-full h-auto"
              />
            ) : (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full"
              />
            )}
          </div>
          
          <div className="flex justify-center mt-4 space-x-3">
            {capturedImage ? (
              <>
                <Button variant="outline" onClick={retake}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retake
                </Button>
                <Button onClick={saveCapture}>
                  <Upload className="mr-2 h-4 w-4" />
                  Use this photo
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button onClick={capture}>
                  <Camera className="mr-2 h-4 w-4" />
                  Capture ID
                </Button>
              </>
            )}
          </div>
          
          <div className="mt-4 text-sm text-gray-500 text-center">
            <p>Position your college ID card clearly in the frame</p>
            <p>Make sure all details are visible and lighting is good</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}