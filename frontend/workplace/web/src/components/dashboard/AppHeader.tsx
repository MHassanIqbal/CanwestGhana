import { useLocation, useParams } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { APP_ROUTES } from "@/routes/appRoutes";
import { PAGE_META_DATA } from "@/components/meta/pageMetaData";
import ThemeToggle from "@/components/common/ThemeToggle";

const stripSuffix = (title: string) => title.split(" | ")[0];

const useHeaderTitle = (): string => {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const path = location.pathname;

  if (path === "/") return stripSuffix(PAGE_META_DATA.dashboard.title);
  if (path === APP_ROUTES.staff) return stripSuffix(PAGE_META_DATA.staff.title);
  if (path === APP_ROUTES.staffNew)
    return stripSuffix(PAGE_META_DATA.staffNew.title);
  if (id && path === APP_ROUTES.staffDetail(id))
    return stripSuffix(PAGE_META_DATA.staffEdit.title);
  if (path === APP_ROUTES.profile)
    return stripSuffix(PAGE_META_DATA.profile.title);

  return "Workplace";
};

const AppHeader = () => {
  const title = useHeaderTitle();

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="h-6! self-center! bg-foreground/20"
      />
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      <div className="flex-1" />
      <ThemeToggle />
    </header>
  );
};

export default AppHeader;
