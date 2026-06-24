import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  LogOut,
  ChevronUp,
  Users,
  User,
  Tag,
  Building2,
  Layers,
} from "lucide-react";
import { staffApi } from "@/api/staffApi";
import { useAuth } from "@/hooks/useAuth";
import { APP_ROUTES } from "@/routes/appRoutes";
import { useCompany } from "@/hooks/useCompany";

const getInitials = (firstName?: string, lastName?: string) =>
  `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { company } = useCompany();

  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  const isAdmin = currentUser?.role === "admin";
  const isManager = currentUser?.role === "manager";

  const { mutate: logout } = useMutation({
    mutationFn: () => staffApi.logout(),
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
      navigate("/login", { replace: true });
    },
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          {company?.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.companyName}
              className="h-8 w-8 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
              <span className="text-xs font-bold text-white">
                {company?.companyName?.[0] ?? "C"}
              </span>
            </div>
          )}
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground truncate">
              {company?.companyName ?? "Loading…"}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {company?.slogan ?? "Workplace"}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location.pathname === "/"}
                  onClick={() => navigate("/")}
                >
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === APP_ROUTES.staff}
                    onClick={() => navigate(APP_ROUTES.staff)}
                  >
                    <Users />
                    <span>Staff</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === APP_ROUTES.company}
                    onClick={() => navigate(APP_ROUTES.company)}
                  >
                    <Building2 />
                    <span>Company</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {(isAdmin || isManager) && (
          <SidebarGroup>
            <SidebarGroupLabel>Ecommerce</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === APP_ROUTES.brand}
                    onClick={() => navigate(APP_ROUTES.brand)}
                  >
                    <Tag />
                    <span>Brand</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={location.pathname === APP_ROUTES.category}
                onClick={() => navigate(APP_ROUTES.category)}
              >
                <Layers />
                <span>Category</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                      {getInitials(
                        currentUser?.firstName,
                        currentUser?.lastName,
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1 text-left">
                    <span className="text-sm font-medium truncate">
                      {currentUser?.firstName} {currentUser?.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {currentUser?.email}
                    </span>
                  </div>
                  <ChevronUp className="h-4 w-4 ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem onClick={() => navigate(APP_ROUTES.profile)}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="text-red-600 focus:text-red-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
