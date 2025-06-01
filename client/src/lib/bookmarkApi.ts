const API_BASE_URL = 'https://employee-insights-api.adityalasika.workers.dev';

export interface BookmarkedInsight {
  bookmark_id: number;
  insight_id: number;
  insight_title: string;
  bookmarked_at: string;
  word_insight?: string;
  total_count?: number;
  positif_count?: number;
  negatif_count?: number;
  netral_count?: number;
  positif_percentage?: number;
  negatif_percentage?: number;
  netral_percentage?: number;
}

export interface BookmarkApiResponse {
  success: boolean;
  data?: BookmarkedInsight[] | BookmarkedInsight;
  total?: number;
  message: string;
  error?: string;
}

// Get all bookmarked insights
export async function getBookmarkedInsights(): Promise<BookmarkedInsight[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks`);
    const data: BookmarkApiResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch bookmarked insights');
    }
    
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error('Error fetching bookmarked insights:', error);
    return [];
  }
}

// Add insight to bookmarks
export async function addBookmark(insightId: number, insightTitle: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        insight_id: insightId,
        insight_title: insightTitle,
      }),
    });
    
    const data: BookmarkApiResponse = await response.json();
    
    if (!data.success) {
      // If already bookmarked, consider it a success
      if (response.status === 409) {
        return true;
      }
      throw new Error(data.error || 'Failed to add bookmark');
    }
    
    return true;
  } catch (error) {
    console.error('Error adding bookmark:', error);
    return false;
  }
}

// Remove bookmark by insight details
export async function removeBookmark(insightId: number, insightTitle: string): Promise<boolean> {
  try {
    const encodedTitle = encodeURIComponent(insightTitle);
    const response = await fetch(`${API_BASE_URL}/api/bookmarks/insight/${insightId}/${encodedTitle}`, {
      method: 'DELETE',
    });
    
    const data: BookmarkApiResponse = await response.json();
    
    if (!data.success) {
      // If bookmark not found, consider it a success (already removed)
      if (response.status === 404) {
        return true;
      }
      throw new Error(data.error || 'Failed to remove bookmark');
    }
    
    return true;
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return false;
  }
}

// Check if insight is bookmarked
export async function isInsightBookmarked(insightId: number, insightTitle: string): Promise<boolean> {
  try {
    const bookmarks = await getBookmarkedInsights();
    return bookmarks.some(bookmark => 
      bookmark.insight_id === insightId && bookmark.insight_title === insightTitle
    );
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
}
