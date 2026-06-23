import { BrowserRouter, Route, Routes } from "react-router-dom";
import DashboardPage from "@/pages/DashboardPage";
import NotFoundPage from "@/pages/NotFoundPage";
import LoginPage from "@/pages/auth/LoginPage";
import { APP_ROUTES } from "@/routes/appRoutes";
import ProtectedLayout from "@/layouts/ProtectedLayout";
import PublicLayout from "@/layouts/PublicLayout";
import AppLayout from "@/layouts/AppLayout";
import RoleGuard from "./guards/RoleGuard";
import StaffListPage from "./pages/staff/StaffListPage";
import CreateStaffPage from "./pages/staff/CreateStaffPage";
import EditStaffPage from "./pages/staff/EditStaffPage";
import ProfilePage from "./pages/staff/ProfilePage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import CompanyPage from "./pages/company/CompanyPage";
import BrandListPage from "./pages/brand/BrandListPage";
import CreateBrandPage from "./pages/brand/CreateBrandPage";
import EditBrandPage from "./pages/brand/EditBrandPage";

const App = () => {
  return (
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  );
};

const AppWrapper = () => {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path={APP_ROUTES.login} element={<LoginPage />} />
        <Route
          path={APP_ROUTES.forgotPassword}
          element={<ForgotPasswordPage />}
        />
        <Route
          path={APP_ROUTES.resetPasswordPattern}
          element={<ResetPasswordPage />}
        />
      </Route>

      <Route element={<ProtectedLayout />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />

          <Route element={<RoleGuard allowedRoles={["admin"]} />}>
            <Route path={APP_ROUTES.staff} element={<StaffListPage />} />
            <Route path={APP_ROUTES.staffNew} element={<CreateStaffPage />} />
            <Route
              path={APP_ROUTES.staffEdit(":id")}
              element={<EditStaffPage />}
            />

            <Route path={APP_ROUTES.company} element={<CompanyPage />} />

            <Route path={APP_ROUTES.brand} element={<BrandListPage />} />
            <Route path={APP_ROUTES.brandNew} element={<CreateBrandPage />} />
            <Route path="/brand/:id" element={<EditBrandPage />} />
          </Route>

          <Route path={APP_ROUTES.profile} element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
