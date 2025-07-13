import { Link } from "wouter";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { MapPin, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import React from "react";

interface ItemCardProps {
  item?: {
    id?: number;
    name?: string;
    description?: string;
    size?: string;
    pricePerDay?: number;
    imageData?: string;
    categoryId?: number;
    category?: {
      name?: string;
    };
    owner?: {
      id?: number;
      hostel?: string;
    };
  };
}

export function ItemCard({ item }: ItemCardProps) {
  // Log the incoming item prop for debugging
  console.log("[ItemCard] incoming item:", item);

  // Prop type checks and fallback values
  if (!item || typeof item !== "object") {
    return (
      <div className="border border-red-400 bg-red-50 text-red-700 p-4 rounded">
        Error rendering item: item prop is missing or invalid
      </div>
    );
  }

  try {
    const id = item.id ?? "unknown";
    const name = item.name ?? "Unnamed Item";
    const description = item.description ?? "No description";
    const size = item.size ?? "N/A";
    const pricePerDay = typeof item.pricePerDay === "number" ? item.pricePerDay : 0;
    const formattedPrice = (pricePerDay / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    const imageData = item.imageData ?? "";
    const imageUrl = imageData
      ? (imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`)
      : undefined;
    const categoryName = item.category?.name ?? "Other";
    const hostel = item.owner?.hostel ?? "Unknown hostel";

    return (
      <div className="group relative">
        <Link href={`/items/${id}`}>
          <div className="w-full bg-gray-200 rounded-md overflow-hidden group-hover:opacity-75 relative">
            <AspectRatio ratio={1 / 1}>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name}
                  className="w-full h-full object-center object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  No image
                </div>
              )}
            </AspectRatio>
            {/* Category tag positioned at the top right */}
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-white bg-opacity-90 text-gray-800">
                {categoryName}
              </Badge>
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <div>
              <h3 className="text-sm text-gray-700 font-medium">
                {name}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Size: {size}</p>
            </div>
            <p className="text-sm font-medium text-gray-900">{formattedPrice}/day</p>
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-1" />
            <p>{hostel}</p>
          </div>
        </Link>
      </div>
    );
  } catch (err) {
    console.error('[ItemCard] Error rendering item:', err, item);
    return (
      <div className="border border-red-400 bg-red-50 text-red-700 p-4 rounded">
        Error rendering item
      </div>
    );
  }
}
