import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CategoryNavigation } from "@/components/home/category-navigation";
import { ItemGrid } from "@/components/home/item-grid";
import { Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<string>("newest");
  
  // Fetch categories for navigation
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });
  
  // Fetch all available items
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["/api/items"],
  });
  
  // Filter items based on selected category, search query, and apply sorting
  const filteredItems = items
    ? items
        .filter((item: any) => {
          const matchesCategory = selectedCategory
            ? item.categoryId === selectedCategory
            : true;
          
          const matchesSearch = searchQuery
            ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.description.toLowerCase().includes(searchQuery.toLowerCase())
            : true;
          
          return matchesCategory && matchesSearch;
        })
        .sort((a: any, b: any) => {
          if (sortOption === "newest") {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          } else if (sortOption === "price_asc") {
            return a.pricePerDay - b.pricePerDay;
          } else if (sortOption === "price_desc") {
            return b.pricePerDay - a.pricePerDay;
          }
          return 0;
        })
    : [];
  
  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Items</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Search and filters */}
        <div className="w-full md:w-1/4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search items..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Sort by</h3>
            <select
              className="w-full p-2 border rounded-md"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium mb-2">Categories</h3>
            <CategoryNavigation 
              onCategorySelect={handleCategoryChange}
              selectedCategory={selectedCategory}
              showAllOption
            />
          </div>
        </div>
        
        {/* Results */}
        <div className="w-full md:w-3/4">
          <div className="mb-4">
            <p className="text-gray-500">
              {filteredItems.length} items found
              {searchQuery && ` for "${searchQuery}"`}
              {selectedCategory && categories && 
                ` in ${categories.find((c: any) => c.id === selectedCategory)?.name}`
              }
            </p>
          </div>
          
          {itemsLoading ? (
            <div className="py-10 text-center">Loading items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-gray-500">No items found matching your criteria.</p>
              <p className="text-gray-500 mt-2">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <ItemGrid items={filteredItems} />
          )}
        </div>
      </div>
    </div>
  );
}