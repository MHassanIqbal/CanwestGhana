import { useAuth } from "@/hooks/useAuth";
import PageMeta from "@/components/meta/PageMeta";
import { PAGE_META_DATA } from "@/components/meta/pageMetaData";

const DashboardPage = () => {
  const { currentUser } = useAuth();

  return (
    <>
      <PageMeta
        title={PAGE_META_DATA.dashboard.title}
        description={PAGE_META_DATA.dashboard.description}
      />

      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome, {currentUser?.firstName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {currentUser?.role} · {currentUser?.email}
        </p>
      </div>
    </>
  );
};

export default DashboardPage;
