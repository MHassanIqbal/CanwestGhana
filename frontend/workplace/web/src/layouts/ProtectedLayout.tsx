import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import FullPageLoader from "@/components/loader/FullPageLoader";
import { APP_ROUTES } from "@/routes/appRoutes";

const ProtectedLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.login} replace />;
  }

  return <Outlet />;
};

export default ProtectedLayout;
