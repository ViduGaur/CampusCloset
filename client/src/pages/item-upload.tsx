import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { WebcamCapture } from "@/components/webcam-capture";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Camera, Upload, Image, X, Loader2 } from "lucide-react";

const itemSchema = z.object({
  name: z.string().min(1, "Item name is required").max(100, "Item name must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be less than 500 characters"),
  size: z.string().min(1, "Size is required").max(20, "Size must be less than 20 characters"),
  pricePerDay: z.coerce.number().min(1, "Price must be at least ₹1").max(10000, "Price must be less than ₹10,000"),
  categoryId: z.coerce.number().min(1, "Please select a category"),
});

type ItemFormValues = z.infer<typeof itemSchema>;

export default function ItemUpload() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "review">("upload");
  const [itemImage, setItemImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Redirect if not logged in or not verified
  if (!user) {
    navigate("/login");
    return null;
  }
  
  if (!user.isVerified) {
    navigate("/verification");
    return null;
  }
  
  // Define category interface 
  interface Category {
    id: number;
    name: string;
    icon?: string;
    parentId?: number | null;
  }
  
  // Fetch categories
  const { data: categories = [] as Category[], isLoading: categoriesLoading, error: categoriesError } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  if (categoriesLoading) {
    return <div className="container max-w-4xl py-10 text-center">Loading categories...</div>;
  }

  if (categoriesError || !categories || categories.length === 0) {
    return <div className="container max-w-4xl py-10 text-center text-red-600">Unable to load categories. Please try again later or contact support.</div>;
  }
  
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      description: "",
      size: "",
      pricePerDay: 100, // Default to 100 rupees which is a valid amount
      categoryId: undefined as unknown as number, // Make the select show the placeholder initially
    },
    mode: "onChange" // Validate on change for better user feedback
  });
  
  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setItemImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };
  
  // Handle webcam capture
  const handleWebcamCapture = (file: File, imageUrl: string) => {
    setItemImage(file);
    setPreviewUrl(imageUrl);
    setActiveTab("review");
  };
  
  // Reset image
  const handleResetImage = () => {
    setItemImage(null);
    setPreviewUrl(null);
    setActiveTab("upload");
  };
  
  // Create item mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: ItemFormValues) => {
      if (!itemImage) {
        throw new Error("Please upload or take a photo of your item");
      }
      
      // Get the user ID from localStorage - we need this for the ownerId in the request
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error("You must be logged in to upload items");
      }
      
      const formData = new FormData();
      formData.append("image", itemImage);
      
      // Include all required fields from the schema (name, description, size, categoryId, pricePerDay)
      // Let the backend add ownerId and imageData fields
      formData.append("data", JSON.stringify({
        ...data,
        // Ensure numeric values are properly converted
        pricePerDay: Number(data.pricePerDay),
        categoryId: Number(data.categoryId)
      }));
      
      // Add user-id to headers for authentication
      // userId will be automatically added by apiRequest function
      return apiRequest("POST", "/api/items", formData);
    },
    onSuccess: (createdItem: any) => {
      toast({
        title: "Item Listed Successfully",
        description: "Your item has been added to the marketplace.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      // Redirect to item detail page if ID is available, else fallback to /my-items
      if (createdItem && createdItem.id) {
        setIsRedirecting(true);
        setTimeout(() => navigate(`/items/${createdItem.id}`), 1200);
      } else {
        setIsRedirecting(true);
        setTimeout(() => navigate("/my-items"), 1200);
      }
    },
    onError: (error: any) => {
      // Check if this is a validation error response from the server
      if (error.status === 400 && error.data?.errors) {
        // Format validation errors nicely
        const errorMessages = error.data.errors.map((err: any) => {
          return `${err.message || "Validation error"}`;
        }).join("\n");
        
        toast({
          title: "Please fix the following errors:",
          description: errorMessages,
          variant: "destructive",
        });
      } else {
        // Generic error handling
        const errorMessage = error.message || error.data?.message || "There was an error listing your item. Please try again.";
        
        toast({
          title: "Error Listing Item",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      // Log the error for debugging
      console.error("Item upload error:", error);
    },
  });
  
  const onSubmit = (data: ItemFormValues) => {
    // Validate image presence before submitting
    if (!itemImage) {
      toast({
        title: "Photo Required",
        description: "Please upload or take a photo of your item before submitting",
        variant: "destructive"
      });
      return;
    }
    
    uploadMutation.mutate(data);
  };
  
  return (
    <div className="container max-w-4xl py-10">
      {isRedirecting && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-lg font-medium">Redirecting...</div>
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">List an Item for Rent</CardTitle>
          <CardDescription>
            Upload photos and details about the item you want to rent out
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-8">
            {/* Item Photo Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-medium">Item Photo</h3>
                <span className="text-destructive">*</span>
                <span className="text-sm text-muted-foreground">(Required)</span>
              </div>
              
              {previewUrl ? (
                <div className="space-y-4">
                  <div className="rounded-lg overflow-hidden border border-green-400 shadow-sm max-w-md mx-auto">
                    <div className="relative">
                      <img src={previewUrl} alt="Item Preview" className="w-full h-auto" />
                      <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-green-600 font-medium">Photo uploaded successfully</p>
                    <Button variant="outline" onClick={handleResetImage}>
                      <X className="mr-2 h-4 w-4" />
                      Change Photo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Camera Option */}
                  <div 
                    className={`border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors ${activeTab === 'camera' ? 'border-primary' : ''}`}
                    onClick={() => setActiveTab("camera")}
                  >
                    <Camera className="h-10 w-10 text-gray-400 mb-4" />
                    <h4 className="font-medium mb-1">Take a Photo</h4>
                    <p className="text-sm text-gray-500 text-center">Use your webcam to take a photo of your item</p>
                  </div>
                  
                  {/* Upload Option */}
                  <div 
                    className={`border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors ${activeTab === 'upload' ? 'border-primary' : ''}`}
                    onClick={() => setActiveTab("upload")}
                  >
                    <Upload className="h-10 w-10 text-gray-400 mb-4" />
                    <h4 className="font-medium mb-1">Upload a Photo</h4>
                    <p className="text-sm text-gray-500 text-center">Select a photo from your device</p>
                  </div>
                </div>
              )}
              
              {/* Webcam Capture */}
              {activeTab === "camera" && !previewUrl && (
                <div className="mt-6">
                  <WebcamCapture 
                    onCapture={handleWebcamCapture}
                    onCancel={() => setActiveTab("upload")}
                  />
                </div>
              )}
              
              {/* File Upload */}
              {activeTab === "upload" && !previewUrl && (
                <div className="mt-6">
                  <div
                    className="border-2 border-dashed border-destructive rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => document.getElementById('item-upload')?.click()}
                  >
                    <Image className="h-10 w-10 text-destructive mb-4" />
                    <h4 className="font-medium mb-1">Upload Item Photo <span className="text-destructive">*</span></h4>
                    <p className="text-sm text-gray-500 mb-2">Drag and drop or click to browse</p>
                    <p className="text-xs text-destructive mb-2">Required for listing your item</p>
                    <p className="text-xs text-gray-400">PNG, JPG or JPEG (max. 5MB)</p>
                    
                    <input
                      id="item-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Item Details Form */}
            <div>
              <h3 className="text-lg font-medium mb-4">Item Details</h3>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Black Formal Suit" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value ? field.value.toString() : ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category: Category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. L, XL, 42, 38" {...field} />
                          </FormControl>
                          <FormDescription>
                            Specify size in standard format
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your item, including condition, material, style, etc." 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="pricePerDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per Day (₹) <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                            <Input className="pl-7" type="number" min="0" step="5" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-4 space-y-4">
                    <div className="text-sm text-muted-foreground border-t pt-3">
                      <p><span className="text-destructive">*</span> All fields marked with an asterisk are required</p>
                      <p>Please ensure you upload a clear photo of your item to increase rental chances</p>
                    </div>
                  
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={uploadMutation.isPending || !itemImage}
                    >
                      {uploadMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "List Item for Rent"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}