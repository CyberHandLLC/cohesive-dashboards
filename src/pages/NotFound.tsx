
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    // Show a toast notification for better UX
    toast({
      variant: "destructive",
      title: "Page not found",
      description: "The requested page could not be found."
    });
  }, [location.pathname]);

  // Check if the path contains 'packages' to provide a more specific message
  const isPackageRoute = location.pathname.includes('/packages/');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl text-gray-600 mb-6">
          {isPackageRoute 
            ? "The package you're looking for doesn't exist or has been deleted."
            : "Sorry, we couldn't find the page you're looking for."}
        </p>
        <div className="space-y-2">
          {isPackageRoute && (
            <Button variant="outline" className="mr-2 w-full" asChild>
              <Link to="/admin/portfolio/packages">
                Go to Packages
              </Link>
            </Button>
          )}
          <Button className="w-full" asChild>
            <Link to="/">
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
