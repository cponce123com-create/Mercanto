import { useCallback } from "react";
import { useGetFavorites, useAddFavorite, useRemoveFavorite } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetFavoritesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/contexts";

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetFavorites({
    query: { enabled: !!user } as any,
  });

  const favoriteIds: number[] = (data as any)?.favoriteIds ?? [];

  const addMutation = useAddFavorite({
    mutation: {
      onMutate: async ({ storeId }: { storeId: number }) => {
        await queryClient.cancelQueries({ queryKey: getGetFavoritesQueryKey() });
        const prev = queryClient.getQueryData(getGetFavoritesQueryKey());
        queryClient.setQueryData(getGetFavoritesQueryKey(), (old: any) => ({
          ...(old || {}),
          favoriteIds: [...((old as any)?.favoriteIds ?? []), storeId],
        }));
        return { prev };
      },
      onError: (_err: any, _vars: any, ctx: any) => {
        queryClient.setQueryData(getGetFavoritesQueryKey(), ctx?.prev);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey() });
      },
    },
  });

  const removeMutation = useRemoveFavorite({
    mutation: {
      onMutate: async ({ storeId }: { storeId: number }) => {
        await queryClient.cancelQueries({ queryKey: getGetFavoritesQueryKey() });
        const prev = queryClient.getQueryData(getGetFavoritesQueryKey());
        queryClient.setQueryData(getGetFavoritesQueryKey(), (old: any) => ({
          ...(old || {}),
          favoriteIds: ((old as any)?.favoriteIds ?? []).filter((id: number) => id !== storeId),
        }));
        return { prev };
      },
      onError: (_err: any, _vars: any, ctx: any) => {
        queryClient.setQueryData(getGetFavoritesQueryKey(), ctx?.prev);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey() });
      },
    },
  });

  const isFavorite = useCallback((storeId: number) => favoriteIds.includes(storeId), [favoriteIds]);

  const toggle = useCallback((storeId: number) => {
    if (!user) return;
    if (isFavorite(storeId)) {
      removeMutation.mutate({ storeId });
    } else {
      addMutation.mutate({ storeId });
    }
  }, [user, isFavorite, addMutation, removeMutation]);

  return { favoriteIds, isFavorite, toggle, isLoading, isLoggedIn: !!user };
}
