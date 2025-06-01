import { KotaSummary, KotaSummaryApiResponse, KotaSummaryRefreshResponse } from '@/types/kota-summary';

const API_BASE_URL = 'https://employee-insights-api.adityalasika.workers.dev';

// Get all kota summary data
export async function getKotaSummary(): Promise<KotaSummary[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/kota-summary`);
    const data: KotaSummaryApiResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch kota summary');
    }
    
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error('Error fetching kota summary:', error);
    return [];
  }
}

// Get specific kota summary by kota name
export async function getKotaSummaryByName(kotaName: string): Promise<KotaSummary | null> {
  try {
    const encodedKota = encodeURIComponent(kotaName);
    const response = await fetch(`${API_BASE_URL}/api/kota-summary/${encodedKota}`);
    const data: KotaSummaryApiResponse = await response.json();
    
    if (!data.success) {
      if (response.status === 404) {
        return null; // Kota not found
      }
      throw new Error(data.error || 'Failed to fetch kota summary');
    }
    
    return Array.isArray(data.data) ? data.data[0] : data.data as KotaSummary;
  } catch (error) {
    console.error('Error fetching kota summary by name:', error);
    return null;
  }
}

// Refresh kota summary data (recalculate from employee_insights)
export async function refreshKotaSummary(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/kota-summary/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data: KotaSummaryRefreshResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to refresh kota summary');
    }
    
    return true;
  } catch (error) {
    console.error('Error refreshing kota summary:', error);
    return false;
  }
}

// Get top N kota by total count
export async function getTopKotaByCount(limit: number = 10): Promise<KotaSummary[]> {
  try {
    const allKota = await getKotaSummary();
    return allKota
      .sort((a, b) => b.total_count - a.total_count)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching top kota:', error);
    return [];
  }
}

// Get kota with highest positive sentiment percentage
export async function getTopPositiveKota(limit: number = 5): Promise<KotaSummary[]> {
  try {
    const allKota = await getKotaSummary();
    return allKota
      .filter(kota => kota.total_count >= 5) // Only include kota with at least 5 insights
      .sort((a, b) => b.positif_percentage - a.positif_percentage)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching top positive kota:', error);
    return [];
  }
}

// Get kota with highest negative sentiment percentage (needs attention)
export async function getTopNegativeKota(limit: number = 5): Promise<KotaSummary[]> {
  try {
    const allKota = await getKotaSummary();
    return allKota
      .filter(kota => kota.total_count >= 5) // Only include kota with at least 5 insights
      .sort((a, b) => b.negatif_percentage - a.negatif_percentage)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching top negative kota:', error);
    return [];
  }
}
