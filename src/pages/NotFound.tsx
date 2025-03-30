
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const isPackageDetailRoute = location.pathname.includes('/admin/portfolio/packages/');

  const goBack = () => {
    if (isPackageDetailRoute) {
      navigate('/admin/portfolio/packages');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Page not found</AlertTitle>
          <AlertDescription>
            The page you are looking for doesn't exist or has been moved.
            {isPackageDetailRoute && " The package may have been deleted or the ID is invalid."}
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center gap-4">
          <Button onClick={goBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isPackageDetailRoute ? 'Back to Packages' : 'Return to Home'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
