import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PageMeta from "@/meta/PageMeta";
import { PAGE_META_DATA } from "@/meta/pageMetaData";

const NotFoundPage = () => {
  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.notFound.title}
        description={PAGE_META_DATA.notFound.description}
      />

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-6">
            <span className="text-white font-bold text-lg">CW</span>
          </div>

          <h1 className="text-5xl font-bold text-gray-900">404</h1>
          <p className="text-lg font-medium text-gray-900 mt-2">
            Page not found
          </p>
          <p className="text-sm text-gray-500 mt-2">
            The page you're looking for doesn't exist or may have been moved.
          </p>

          <Button asChild className="mt-6">
            <Link to="/">Go Back</Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
