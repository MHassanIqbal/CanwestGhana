import { useQuery } from "@tanstack/react-query";
import { companyApi } from "@/api/companyApi";

export const useCompany = () => {
  const { data: company, isLoading } = useQuery({
    queryKey: ["company"],
    queryFn: () => companyApi.getCompany(),
    staleTime: 1000 * 60 * 10, // company info changes rarely
  });

  return { company, isLoading };
};
