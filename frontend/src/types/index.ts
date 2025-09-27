export interface Listing {
  id: string;
  external_id: string;
  source: 'realtor_ca' | 'mls' | 'kijiji' | 'other';
  url: string;
  title: string;
  description?: string;
  price: number;
  price_currency: string;
  listing_type: 'rent' | 'sale' | 'lease';
  property_type: 'house' | 'condo' | 'townhouse' | 'apartment' | 'land' | 'commercial' | 'other';
  address: string;
  city: string;
  province: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  lot_size?: number;
  year_built?: number;
  parking?: number;
  images: string[];
  features: string[];
  contact_info?: {
    agent?: string;
    phone?: string;
    email?: string;
  };
  status: 'active' | 'inactive' | 'sold' | 'rented' | 'expired';
  last_scraped_at: string;
  first_seen_at: string;
  removed_at?: string;
}

export interface SearchFilters {
  page?: number;
  limit?: number;
  source?: string;
  listing_type?: string;
  property_type?: string;
  city?: string;
  province?: string;
  price_min?: number;
  price_max?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet_min?: number;
  square_feet_max?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  status?: string;
}

export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ListingsResponse {
  listings: Listing[];
  pagination: PaginationInfo;
  filters_applied: Partial<SearchFilters>;
}

export interface FilterOption {
  label: string;
  value: string | number;
}

export interface FilterOptions {
  cities: string[];
  property_types: string[];
  sources: string[];
  listing_types: string[];
  bedrooms: (number | string)[];
  bathrooms: (number | string)[];
  price_ranges: {
    label: string;
    min: number;
    max: number | null;
  }[];
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  listing: Listing;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  search_criteria: SearchFilters;
  is_active: boolean;
  notify_new_results: boolean;
  last_notification_at?: string;
  created_at: string;
}

export interface ScrapingLog {
  id: string;
  source: string;
  status: 'started' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  listings_found: number;
  listings_new: number;
  listings_updated: number;
  listings_removed: number;
  errors: Array<{
    timestamp: string;
    message: string;
  }>;
}

export interface Statistics {
  overview: {
    total_listings: number;
    active_listings: number;
    new_listings_period: number;
    period: string;
    average_price: number;
  };
  distribution: {
    by_source: Array<{ source: string; count: number }>;
    by_listing_type: Array<{ type: string; count: number }>;
    by_property_type: Array<{ type: string; count: number }>;
    by_price_range: Array<{ range: string; count: number }>;
  };
  recent_activity: {
    new_listings: Listing[];
    scraping_logs: ScrapingLog[];
  };
  period_info: {
    period: string;
    start_date: string;
    end_date: string;
  };
}