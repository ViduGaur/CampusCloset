import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Shirt, Briefcase, UserRound, Gem, Footprints, MoreHorizontal, LayersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Map category icons to Lucide React components
const iconMap: Record<string, React.ReactNode> = {
  shirt: <Shirt />,
  "shoe-prints": <Footprints />,
  gem: <Gem />,
  "user-tie": <UserRound />,
  tshirt: <Shirt />,
  vest: <Briefcase />,
};

interface CategoryNavigationProps {
  onCategorySelect?: (categoryId: number | null) => void;
  selectedCategory?: number | null;
  showAllOption?: boolean;
  compact?: boolean;
}

export function CategoryNavigation({
  onCategorySelect,
  selectedCategory = null,
  showAllOption = false,
  compact = false
}: CategoryNavigationProps) {
  const { data: categories, isLoading } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  // Default categories if API call is loading or fails
  const defaultCategories = [
    { id: 1, name: "Tops", icon: "shirt", bgColor: "bg-indigo-100", textColor: "text-primary" },
    { id: 2, name: "Bottoms", icon: "vest", bgColor: "bg-blue-100", textColor: "text-blue-600" },
    { id: 3, name: "Formal", icon: "user-tie", bgColor: "bg-red-100", textColor: "text-red-600" },
    { id: 4, name: "Accessories", icon: "gem", bgColor: "bg-amber-100", textColor: "text-amber-600" },
    { id: 5, name: "Footwear", icon: "shoe-prints", bgColor: "bg-emerald-100", textColor: "text-emerald-600" },
    { id: 6, name: "More", icon: "more", bgColor: "bg-gray-100", textColor: "text-gray-600" },
  ];

  const displayCategories = (categories && categories.length > 0) ? categories : defaultCategories;

  const handleCategoryClick = (categoryId: number) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId === selectedCategory ? null : categoryId);
    }
  };

  const allCategoriesOption = {
    id: 0,
    name: "All Categories",
    icon: "layers",
    bgColor: "bg-gray-100",
    textColor: "text-gray-600"
  };

  // Determine which categories to display
  let categoriesToDisplay = [...displayCategories];
  if (showAllOption) {
    categoriesToDisplay = [allCategoriesOption, ...categoriesToDisplay];
  }

  // Grid columns based on compact prop
  const gridCols = compact
    ? "grid grid-cols-2 gap-2"
    : "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 text-center";

  return (
    <div className={compact ? "" : "bg-white rounded-lg shadow-sm"}>
      <div className={compact ? "" : "px-4 py-5 sm:p-6"}>
        {!compact && <h2 className="text-lg font-medium text-gray-900 mb-4">Browse by Category</h2>}
        <div className={gridCols}>
          {categoriesToDisplay.map((category: any) => {
            // Get the icon component or use MoreHorizontal as fallback
            let IconComponent;
            if (category.icon === "layers") {
              IconComponent = <LayersIcon />;
            } else {
              IconComponent = category.icon in iconMap 
                ? iconMap[category.icon] 
                : <MoreHorizontal />;
            }
              
            // Get background and text colors or use defaults
            const bgColor = category.bgColor || "bg-primary-100";
            const textColor = category.textColor || "text-primary";

            // Check if this category is selected
            const isSelected = selectedCategory === category.id;
            const selectedBg = isSelected ? "bg-primary/10" : "";

            // For clickable categories with onCategorySelect vs link navigation
            if (onCategorySelect) {
              return (
                <div 
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer",
                    selectedBg
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center mb-2",
                    bgColor
                  )}>
                    <span className={textColor}>
                      {IconComponent}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700">{category.name}</span>
                </div>
              );
            }

            return (
              <Link 
                key={category.id}
                href={`/browse?category=${category.id}`}
              >
                <a className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center mb-2",
                    bgColor
                  )}>
                    <span className={textColor}>
                      {IconComponent}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700">{category.name}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
