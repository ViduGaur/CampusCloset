import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertItemSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WebcamCapture } from "@/components/webcam-capture";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Camera, Upload } from "lucide-react";

// Extend the schema with additional validation if needed
const formSchema = insertItemSchema;

type FormValues = z.infer<typeof formSchema>;

export function ItemUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get categories for selection
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      size: "",
      pricePerDay: 500, // $5.00 in cents
      categoryId: 1,
      ownerId: user?.id,
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: FormValues & { imageFile: File }) => {
      const { imageFile, ...itemData } = data;
      
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("data", JSON.stringify(itemData));
      
      const response = await fetch("/api/items", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          "user-id": user.id.toString(), // For demonstration, typically handled by proper auth
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload item");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "Success",
        description: "Your item has been listed",
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload item",
        variant: "destructive",
      });
    },
  });

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

  const onSubmit = async (values: FormValues) => {
    if (!file) {
      toast({
        title: "Missing image",
        description: "Please upload an image of your item",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate({
      ...values,
      imageFile: file,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">List an Item</h2>
        <p className="mt-2 text-sm text-gray-600">
          Share your fashion items with other students on campus
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <FormLabel className="block text-sm font-medium text-gray-700 mb-1">
                  Item Photo
                </FormLabel>
                {showCamera ? (
                  <WebcamCapture 
                    onCapture={handleCaptureFromWebcam} 
                    onCancel={() => setShowCamera(false)} 
                  />
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
                          alt="Item Preview"
                          className="mx-auto max-h-48 rounded-lg"
                        />
                        <div className="flex justify-center space-x-2">
                          <Button
                            type="button"
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
                            type="button"
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
                            type="button"
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
                            type="button"
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
                {!previewUrl && (
                  <p className="mt-2 text-sm text-red-600">
                    Please upload a clear photo of your item
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="White Formal Shirt" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="XS">Extra Small (XS)</SelectItem>
                        <SelectItem value="S">Small (S)</SelectItem>
                        <SelectItem value="M">Medium (M)</SelectItem>
                        <SelectItem value="L">Large (L)</SelectItem>
                        <SelectItem value="XL">Extra Large (XL)</SelectItem>
                        <SelectItem value="XXL">Double XL (XXL)</SelectItem>
                        <SelectItem value="One Size">One Size</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoriesLoading ? (
                          <SelectItem value="loading">Loading categories...</SelectItem>
                        ) : (
                          categories?.map((category: any) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricePerDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rental Price per Day (in cents)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value || "0"))}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter price in cents (e.g., 500 = $5.00)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe your item, including condition and any other relevant details."
                        className="resize-none"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                disabled={uploadMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={uploadMutation.isPending || !previewUrl}
              >
                {uploadMutation.isPending ? "Uploading..." : "List Item"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
