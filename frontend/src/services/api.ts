import axios from 'axios';
import {
  Listing,
  ListingsResponse,
  SearchFilters,
  FilterOptions,
  Favorite,
  SavedSearch,
  Statistics,
  ScrapingLog,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const listingsApi = {
  getListings: async (filters: SearchFilters): Promise<ListingsResponse> => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/listings?${params.toString()}`);
    return response.data;
  },

  getListing: async (id: string): Promise<{ listing: Listing }> => {
    const response = await api.get(`/listings/${id}`);
    return response.data;
  },

  getFilterOptions: async (): Promise<FilterOptions> => {
    const response = await api.get('/listings/filters/options');
    return response.data;
  },

  getSuggestions: async (query: string, type: 'city' | 'address' = 'city'): Promise<{ suggestions: string[] }> => {
    const response = await api.get(`/listings/search/suggest?q=${encodeURIComponent(query)}&type=${type}`);
    return response.data;
  },
};

export const favoritesApi = {
  getFavorites: async (userId: string, page = 1, limit = 20): Promise<{
    favorites: Favorite[];
    pagination: any;
  }> => {
    const response = await api.get(`/favorites/${userId}?page=${page}&limit=${limit}`);
    return response.data;
  },

  addFavorite: async (userId: string, listingId: string, notes?: string): Promise<{
    message: string;
    favorite: Favorite;
  }> => {
    const response = await api.post('/favorites', {
      user_id: userId,
      listing_id: listingId,
      notes,
    });
    return response.data;
  },

  updateFavorite: async (favoriteId: string, notes: string): Promise<{
    message: string;
    favorite: Favorite;
  }> => {
    const response = await api.put(`/favorites/${favoriteId}`, { notes });
    return response.data;
  },

  removeFavorite: async (favoriteId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/favorites/${favoriteId}`);
    return response.data;
  },

  checkFavoriteStatus: async (userId: string, listingId: string): Promise<{
    is_favorited: boolean;
    favorite_id: string | null;
  }> => {
    const response = await api.get(`/favorites/check/${userId}/${listingId}`);
    return response.data;
  },
};

export const searchesApi = {
  getSavedSearches: async (userId: string): Promise<{ saved_searches: SavedSearch[] }> => {
    const response = await api.get(`/searches/${userId}`);
    return response.data;
  },

  saveSearch: async (
    userId: string,
    name: string,
    searchCriteria: SearchFilters,
    notifyNewResults = false
  ): Promise<{
    message: string;
    saved_search: SavedSearch;
  }> => {
    const response = await api.post('/searches', {
      user_id: userId,
      name,
      search_criteria: searchCriteria,
      notify_new_results: notifyNewResults,
    });
    return response.data;
  },

  updateSearch: async (
    searchId: string,
    updates: {
      name?: string;
      search_criteria?: SearchFilters;
      notify_new_results?: boolean;
    }
  ): Promise<{
    message: string;
    saved_search: SavedSearch;
  }> => {
    const response = await api.put(`/searches/${searchId}`, updates);
    return response.data;
  },

  deleteSearch: async (searchId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/searches/${searchId}`);
    return response.data;
  },

  executeSearch: async (searchId: string, page = 1, limit = 20): Promise<{
    saved_search: SavedSearch;
    results: ListingsResponse;
  }> => {
    const response = await api.get(`/searches/${searchId}/execute?page=${page}&limit=${limit}`);
    return response.data;
  },
};

export const statsApi = {
  getStatistics: async (period = '7d'): Promise<Statistics> => {
    const response = await api.get(`/stats?period=${period}`);
    return response.data;
  },

  getCityStatistics: async (limit = 20): Promise<{
    city_statistics: Array<{
      city: string;
      province: string;
      listing_count: number;
      average_price: number;
      min_price: number;
      max_price: number;
    }>;
  }> => {
    const response = await api.get(`/stats/cities?limit=${limit}`);
    return response.data;
  },

  getTrends: async (period = '30d', metric = 'count'): Promise<{
    trends: Array<{
      date: string;
      value: number;
    }>;
    metric: string;
    period: string;
  }> => {
    const response = await api.get(`/stats/trends?period=${period}&metric=${metric}`);
    return response.data;
  },
};

export const scrapingApi = {
  getStatus: async (): Promise<{
    available_scrapers: string[];
    running_scrapers: string[];
    recent_logs: ScrapingLog[];
  }> => {
    const response = await api.get('/scraping/status');
    return response.data;
  },

  startScraper: async (source: string, searchParams = {}): Promise<{
    message: string;
    source: string;
    search_params: any;
  }> => {
    const response = await api.post(`/scraping/start/${source}`, searchParams);
    return response.data;
  },

  startAllScrapers: async (searchParams = {}): Promise<{
    message: string;
    available_scrapers: string[];
    search_params: any;
  }> => {
    const response = await api.post('/scraping/start-all', searchParams);
    return response.data;
  },

  stopScraper: async (source: string): Promise<{
    message: string;
    source: string;
    stopped: boolean;
  }> => {
    const response = await api.post(`/scraping/stop/${source}`);
    return response.data;
  },

  stopAllScrapers: async (): Promise<{
    message: string;
    results: any;
  }> => {
    const response = await api.post('/scraping/stop-all');
    return response.data;
  },

  getLogs: async (filters: {
    page?: number;
    limit?: number;
    source?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<{
    logs: ScrapingLog[];
    pagination: any;
  }> => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/scraping/logs?${params.toString()}`);
    return response.data;
  },

  getLog: async (logId: string): Promise<{ log: ScrapingLog }> => {
    const response = await api.get(`/scraping/logs/${logId}`);
    return response.data;
  },
};

export const healthApi = {
  checkHealth: async (): Promise<{
    status: string;
    timestamp: string;
    version: string;
    environment: string;
  }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;