// Types for Kota Summary data
export interface KotaSummary {
  id: number;
  kota: string;
  total_count: number;
  positif_count: number;
  negatif_count: number;
  netral_count: number;
  positif_percentage: number;
  negatif_percentage: number;
  netral_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface KotaSummaryApiResponse {
  success: boolean;
  data: KotaSummary[] | KotaSummary;
  total?: number;
  message: string;
  error?: string;
}

export interface KotaSummaryRefreshResponse {
  success: boolean;
  message: string;
  count: number;
  error?: string;
}
