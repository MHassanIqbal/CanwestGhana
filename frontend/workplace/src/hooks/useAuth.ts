import { useQuery } from "@tanstack/react-query";
import { staffApi } from "@/api/staffApi";

export const useAuth = () => {
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => staffApi.getProfile(),
    retry: false,
    staleTime: Infinity,
  });

  return {
    currentUser: currentUser ?? null,
    isLoading,
    isAuthenticated: !!currentUser,
  };
};
