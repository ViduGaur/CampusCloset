import { Link } from "wouter";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { MapPin } from "lucide-react";
import { formatDistance } from "date-fns";

interface ItemCardProps {
  item: {
    id: number;
    name: string;
    description: string;
    size: string;
    pricePerDay: number;
    imageData: string;
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

  // Calculate distance between hostels (mock implementation)
  // In a real app, you'd use actual geolocation data
  const getDistance = (hostel: string) => {
    // This is just a mock implementation that returns a random distance
    return (Math.random() * 2).toFixed(1);
  };

  return (
    <div className="group relative">
      <Link href={`/items/${item.id}`}>
        <div className="w-full bg-gray-200 rounded-md overflow-hidden group-hover:opacity-75">
          <AspectRatio ratio={1 / 1}>
            <img
              src={`data:image/jpeg;base64,${item.imageData}`}
              alt={item.name}
              className="w-full h-full object-center object-cover"
            />
          </AspectRatio>
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
          <p>{item.owner.hostel} ({getDistance(item.owner.hostel)} mi)</p>
        </div>
      </Link>
    </div>
  );
}
