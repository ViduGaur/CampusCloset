import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

// Rating form schema
const ratingFormSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, "Please leave a comment about your experience"),
});

type RatingFormValues = z.infer<typeof ratingFormSchema>;

interface RatingFormProps {
  toUserId: number;
  rentalRequestId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RatingForm({ toUserId, rentalRequestId, onSuccess, onCancel }: RatingFormProps) {
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RatingFormValues>({
    resolver: zodResolver(ratingFormSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const ratingMutation = useMutation({
    mutationFn: async (data: RatingFormValues) => {
      return await apiRequest("POST", "/api/ratings", {
        ...data,
        toUserId,
        rentalRequestId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Rating submitted",
        description: "Thank you for your feedback!",
      });
      
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${toUserId}/ratings`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", toUserId, "profile"] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to submit rating",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: RatingFormValues) => {
    // Incorporate the selected rating into the form data
    const formData = {
      ...data,
      rating: selectedRating,
    };
    
    ratingMutation.mutate(formData);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Rate Your Experience</CardTitle>
        <CardDescription>
          Share your experience with this user to help others in the community
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-center pt-2 pb-6">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Star
                  key={rating}
                  className={`h-8 w-8 cursor-pointer mx-1 transition-colors ${
                    (hoverRating || selectedRating) >= rating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                  onClick={() => setSelectedRating(rating)}
                  onMouseEnter={() => setHoverRating(rating)}
                  onMouseLeave={() => setHoverRating(0)}
                />
              ))}
            </div>
            {selectedRating === 0 && (
              <p className="text-sm text-red-500 text-center">
                Please select a rating
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Textarea
              placeholder="Share details of your experience..."
              {...register("comment")}
              className={errors.comment ? "border-red-500" : ""}
            />
            {errors.comment && (
              <p className="text-sm text-red-500">{errors.comment.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || selectedRating === 0}
            className="ml-auto"
          >
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}