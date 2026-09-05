import { trpc } from "@/lib/trpc";

export function useAuth() {
  const authQuery = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => authQuery.refetch(),
  });

  return {
    user: authQuery.data ?? null,
    loading: authQuery.isLoading,
    logout: () => logoutMutation.mutate(),
  };
}