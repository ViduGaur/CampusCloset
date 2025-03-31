import { Link } from "wouter";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { MapPin, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ItemCardProps {
  item: {
    id: number;
    name: string;
    description: string;
    size: string;
    pricePerDay: number;
    imageData: string;
    categoryId: number;
    category?: {
      name: string;
    };
    owner: {
      id: number;
      hostel: string;
    };
  };
}

export function ItemCard({ item }: ItemCardProps) {
  // Format the price - convert from cents to dollars
  const formattedPrice = (item.pricePerDay / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div className="group relative">
      <Link href={`/items/${item.id}`}>
        <div className="w-full bg-gray-200 rounded-md overflow-hidden group-hover:opacity-75 relative">
          <AspectRatio ratio={1 / 1}>
            <img
              src={item.imageData.startsWith('data:') 
                ? item.imageData 
                : `data:image/jpeg;base64,${item.imageData}`}
              alt={item.name}
              className="w-full h-full object-center object-cover"
            />
          </AspectRatio>
          {/* Category tag positioned at the top right */}
          {item.category && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-white bg-opacity-90 text-gray-800">
                {item.category.name}
              </Badge>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-between">
          <div>
            <h3 className="text-sm text-gray-700 font-medium">
              {item.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500">Size: {item.size}</p>
          </div>
          <p className="text-sm font-medium text-gray-900">{formattedPrice}/day</p>
        </div>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <MapPin className="h-4 w-4 mr-1" />
          <p>{item.owner.hostel}</p>
        </div>
      </Link>
    </div>
  );
}
