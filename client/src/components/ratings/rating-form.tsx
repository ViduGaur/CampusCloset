import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const ratingSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(5, "Comment must be at least 5 characters"),
});

type RatingFormValues = z.infer<typeof ratingSchema>;

interface RatingFormProps {
  userId: number;
  rentalId: number;
}

export function RatingForm({ userId, rentalId }: RatingFormProps) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<RatingFormValues>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });
  
  const mutation = useMutation({
    mutationFn: (data: RatingFormValues) => {
      return apiRequest("POST", "/api/ratings", {
        toUserId: userId,
        rentalRequestId: rentalId,
        rating: data.rating,
        comment: data.comment,
      });
    },
    onSuccess: () => {
      toast({
        title: "Rating submitted",
        description: "Your rating has been submitted successfully.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/my-rental-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-items/rental-requests"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/ratings`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/profile`] });
      
      // Navigate back to profile
      setLocation(`/profile/${userId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
      console.error("Rating submission error:", error);
    },
  });
  
  const onSubmit = (data: RatingFormValues) => {
    mutation.mutate(data);
  };
  
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Rate Borrower</CardTitle>
        <CardDescription>
          Rate how well the borrower took care of your item.
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating (1-5)</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Poor (1)</span>
                        <span>Fair (2)</span>
                        <span>Good (3)</span>
                        <span>Great (4)</span>
                        <span>Excellent (5)</span>
                      </div>
                      <div className="text-center text-2xl font-bold mt-2">
                        {field.value} / 5
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    How would you rate their care of your item?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your experience with this borrower..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide details about how the item was returned and your overall experience.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(`/profile/${userId}`)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Submitting..." : "Submit Rating"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}