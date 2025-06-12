import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getBookmarkedInsights, 
  addBookmark, 
  removeBookmark, 
  BookmarkedInsight 
} from '@/lib/bookmarkApi';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const BOOKMARK_QUERY_KEYS = {
  all: ['bookmarks'],
  list: () => [...BOOKMARK_QUERY_KEYS.all, 'list'],
} as const;

// Hook to get all bookmarked insights
export function useBookmarkedInsights() {
  return useQuery({
    queryKey: BOOKMARK_QUERY_KEYS.list(),
    queryFn: getBookmarkedInsights,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

// Hook to manage bookmark operations
export function useBookmarkOperations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addBookmarkMutation = useMutation({
    mutationFn: ({ insightId, insightTitle }: { insightId: number; insightTitle: string }) =>
      addBookmark(insightId, insightTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKMARK_QUERY_KEYS.all });
      toast({
        title: "Berhasil",
        description: "Insight berhasil disimpan ke My Insights",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menyimpan insight",
        variant: "destructive",
      });
    },
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: ({ insightId, insightTitle }: { insightId: number; insightTitle: string }) =>
      removeBookmark(insightId, insightTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKMARK_QUERY_KEYS.all });
      toast({
        title: "Berhasil",
        description: "Insight berhasil dihapus dari My Insights",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menghapus insight",
        variant: "destructive",
      });
    },
  });

  return {
    addBookmark: addBookmarkMutation.mutate,
    removeBookmark: removeBookmarkMutation.mutate,
    isAddingBookmark: addBookmarkMutation.isPending,
    isRemovingBookmark: removeBookmarkMutation.isPending,
  };
}

// Hook to check if specific insight is bookmarked
export function useIsBookmarked(insightId: number, insightTitle: string) {
  const { data: bookmarks = [] } = useBookmarkedInsights();
  
  return bookmarks.some(bookmark => 
    bookmark.insight_id === insightId && bookmark.insight_title === insightTitle
  );
}

// Hook to manage bookmark state for a specific insight
export function useBookmarkState(insightId: number, insightTitle: string) {
  const isBookmarked = useIsBookmarked(insightId, insightTitle);
  const { addBookmark, removeBookmark, isAddingBookmark, isRemovingBookmark } = useBookmarkOperations();
  
  const toggleBookmark = () => {
    if (isBookmarked) {
      removeBookmark({ insightId, insightTitle });
    } else {
      addBookmark({ insightId, insightTitle });
    }
  };

  return {
    isBookmarked,
    toggleBookmark,
    isLoading: isAddingBookmark || isRemovingBookmark,
  };
}
