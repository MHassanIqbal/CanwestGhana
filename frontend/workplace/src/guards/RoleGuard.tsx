import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { StaffRole } from "@/types/staff";

interface RoleGuardProps {
  allowedRoles: StaffRole[];
}

const RoleGuard = ({ allowedRoles }: RoleGuardProps) => {
  const { currentUser } = useAuth();

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RoleGuard;
