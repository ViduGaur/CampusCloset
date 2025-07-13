import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/users", id, "profile"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${id}/profile`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    enabled: !!id,
  });
  if (isLoading) return <div className="container py-20 text-center">Loading profile...</div>;
  if (error || !data) return <div className="container py-20 text-center text-red-600">Failed to load profile.</div>;
  return (
    <div className="container max-w-xl py-10 mx-auto">
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h1 className="text-3xl font-bold mb-2">{data.fullName || data.username}</h1>
        <div className="text-gray-500 mb-2">{data.email}</div>
        {data.trustRating !== null && data.trustRating !== undefined && (
          <div className="flex items-center justify-center mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={i < Math.round(data.trustRating) ? "text-yellow-400" : "text-gray-300"} />
            ))}
            <span className="ml-2 font-semibold">{data.trustRating.toFixed(2)}</span>
            <span className="ml-2 text-gray-500">({data.ratingCount} ratings)</span>
          </div>
        )}
      </div>
    </div>
  );
}
