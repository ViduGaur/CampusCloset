import { Link } from "wouter";
import { Shirt } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center">
            <Shirt className="h-5 w-5 text-primary mr-2" />
            <span className="font-bold text-lg text-primary">Campus Closet</span>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            © {new Date().getFullYear()} Campus Closet. All rights reserved.
          </p>
          <div className="mt-3 flex space-x-6">
            <Link href="/privacy">
              <span className="sr-only">Privacy Policy</span>
              <span className="text-sm text-gray-400 hover:text-gray-500">
                Privacy
              </span>
            </Link>
            <Link href="/terms">
              <span className="sr-only">Terms of Service</span>
              <span className="text-sm text-gray-400 hover:text-gray-500">
                Terms
              </span>
            </Link>
            <Link href="/contact">
              <span className="sr-only">Contact Us</span>
              <span className="text-sm text-gray-400 hover:text-gray-500">
                Contact
              </span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
