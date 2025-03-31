import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CategoryNavigation } from "@/components/home/category-navigation";
import { ItemGrid } from "@/components/home/item-grid";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          {/* Hero Section */}
          <div className="relative bg-primary rounded-xl overflow-hidden">
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                alt="College students" 
                className="w-full h-full object-cover mix-blend-overlay opacity-20"
              />
            </div>
            <div className="relative px-6 py-16 sm:px-12 lg:px-16">
              <div className="text-center">
                <h1 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
                  Campus Closet
                </h1>
                <p className="mt-4 text-xl text-white opacity-90 max-w-md mx-auto">
                  Borrow, lend, and share fashion items with other students on campus
                </p>
                <div className="mt-8 flex justify-center">
                  <Link href="/browse">
                    <Button variant="secondary" size="lg" className="px-6">
                      Browse Items
                    </Button>
                  </Link>
                  <Link href={user?.isVerified ? "/upload-item" : "/verification"}>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="ml-4 px-6 bg-white text-primary hover:bg-gray-100 border-white"
                    >
                      {user?.isVerified ? "List an Item" : "Get Verified"}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Category Navigation */}
          <CategoryNavigation />

          {/* Items Grid */}
          <ItemGrid />
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
