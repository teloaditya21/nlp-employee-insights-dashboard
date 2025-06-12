import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getKotaSummary, 
  getKotaSummaryByName, 
  refreshKotaSummary,
  getTopKotaByCount,
  getTopPositiveKota,
  getTopNegativeKota
} from '@/lib/kotaSummaryApi';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const KOTA_SUMMARY_QUERY_KEYS = {
  all: ['kota-summary'],
  list: () => [...KOTA_SUMMARY_QUERY_KEYS.all, 'list'],
  byName: (kota: string) => [...KOTA_SUMMARY_QUERY_KEYS.all, 'by-name', kota],
  topByCount: (limit: number) => [...KOTA_SUMMARY_QUERY_KEYS.all, 'top-by-count', limit],
  topPositive: (limit: number) => [...KOTA_SUMMARY_QUERY_KEYS.all, 'top-positive', limit],
  topNegative: (limit: number) => [...KOTA_SUMMARY_QUERY_KEYS.all, 'top-negative', limit],
} as const;

// Hook to get all kota summary data
export function useKotaSummary() {
  return useQuery({
    queryKey: KOTA_SUMMARY_QUERY_KEYS.list(),
    queryFn: getKotaSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

// Hook to get specific kota summary by name
export function useKotaSummaryByName(kotaName: string) {
  return useQuery({
    queryKey: KOTA_SUMMARY_QUERY_KEYS.byName(kotaName),
    queryFn: () => getKotaSummaryByName(kotaName),
    enabled: !!kotaName,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}

// Hook to get top kota by total count
export function useTopKotaByCount(limit: number = 10) {
  return useQuery({
    queryKey: KOTA_SUMMARY_QUERY_KEYS.topByCount(limit),
    queryFn: () => getTopKotaByCount(limit),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}

// Hook to get top positive kota
export function useTopPositiveKota(limit: number = 5) {
  return useQuery({
    queryKey: KOTA_SUMMARY_QUERY_KEYS.topPositive(limit),
    queryFn: () => getTopPositiveKota(limit),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}

// Hook to get top negative kota (needs attention)
export function useTopNegativeKota(limit: number = 5) {
  return useQuery({
    queryKey: KOTA_SUMMARY_QUERY_KEYS.topNegative(limit),
    queryFn: () => getTopNegativeKota(limit),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}

// Hook to refresh kota summary data
export function useRefreshKotaSummary() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: refreshKotaSummary,
    onSuccess: () => {
      // Invalidate all kota summary queries
      queryClient.invalidateQueries({ queryKey: KOTA_SUMMARY_QUERY_KEYS.all });
      toast({
        title: "Berhasil",
        description: "Data summary kota berhasil diperbarui",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal memperbarui data summary kota",
        variant: "destructive",
      });
    },
  });
}
