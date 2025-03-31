import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ItemCard } from "./item-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface ItemGridProps {
  items?: any[];
  showSearch?: boolean;
  showFilters?: boolean;
  isLoading?: boolean;
}

export function ItemGrid({ 
  items: propItems, 
  showSearch = true, 
  showFilters = true, 
  isLoading: propIsLoading 
}: ItemGridProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [sizeFilter, setSizeFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<string>("newest");

  // Only fetch items if they weren't provided as props
  const { data: fetchedItems, isLoading: isItemsLoading } = useQuery({
    queryKey: ["/api/items", categoryFilter],
    queryFn: async ({ queryKey }) => {
      const categoryId = queryKey[1];
      const url = categoryId 
        ? `/api/items?categoryId=${categoryId}` 
        : "/api/items";
      return fetch(url, { credentials: "include" }).then(res => res.json());
    },
    enabled: !propItems // Only run the query if items were not provided via props
  });

  // Use the provided items or the fetched items
  const items = propItems || fetchedItems;
  const isLoading = propIsLoading !== undefined ? propIsLoading : isItemsLoading;

  // Filter and sort items
  const filteredItems = items
    ? items
        .filter((item: any) => 
          !searchQuery || 
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter((item: any) => 
          !sizeFilter || item.size === sizeFilter
        )
        .sort((a: any, b: any) => {
          if (sortOrder === "newest") {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          } else if (sortOrder === "priceAsc") {
            return a.pricePerDay - b.pricePerDay;
          } else if (sortOrder === "priceDesc") {
            return b.pricePerDay - a.pricePerDay;
          }
          return 0;
        })
    : [];

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 sm:p-6">
        {(showSearch || showFilters) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-medium text-gray-900 mb-4 sm:mb-0">
              Available Items
            </h2>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              {showSearch && (
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search items..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              )}
              
              {showFilters && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                      checked={sortOrder === "newest"}
                      onCheckedChange={() => setSortOrder("newest")}
                    >
                      Newest
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={sortOrder === "priceAsc"}
                      onCheckedChange={() => setSortOrder("priceAsc")}
                    >
                      Price: Low to High
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={sortOrder === "priceDesc"}
                      onCheckedChange={() => setSortOrder("priceDesc")}
                    >
                      Price: High to Low
                    </DropdownMenuCheckboxItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuLabel>Size</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                      checked={sizeFilter === null}
                      onCheckedChange={() => setSizeFilter(null)}
                    >
                      All Sizes
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={sizeFilter === "S"}
                      onCheckedChange={() => setSizeFilter("S")}
                    >
                      Small (S)
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={sizeFilter === "M"}
                      onCheckedChange={() => setSizeFilter("M")}
                    >
                      Medium (M)
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={sizeFilter === "L"}
                      onCheckedChange={() => setSizeFilter("L")}
                    >
                      Large (L)
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={sizeFilter === "XL"}
                      onCheckedChange={() => setSizeFilter("XL")}
                    >
                      Extra Large (XL)
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredItems.map((item: any) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="mt-6 text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500">No items found matching your criteria</p>
            <Button
              variant="link"
              onClick={() => {
                setSearchQuery("");
                setSizeFilter(null);
                setCategoryFilter(null);
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
