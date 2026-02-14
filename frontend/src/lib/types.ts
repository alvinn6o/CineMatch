export interface Movie {
  id: number;
  title: string;
  original_title?: string;
  overview?: string;
  release_date?: string;
  runtime?: number;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  revenue?: number;
  budget?: number;
  original_language?: string;
  genres?: string;
  keywords?: string;
  production_companies?: string;
  spoken_languages?: string;
  poster_path?: string;
  backdrop_path?: string;
  tagline?: string;
  imdb_id?: string;
}

export interface MovieSearchResult {
  movies: Movie[];
  total: number;
  page: number;
  pages: number;
}

export interface WatchedEntry {
  id: number;
  movie_id: number;
  rating?: number;
  notes?: string;
  watched_date?: string;
  created_at?: string;
  movie?: Movie;
}

export interface WatchlistEntry {
  id: number;
  movie_id: number;
  added_at?: string;
  movie?: Movie;
}

export interface RecommendationItem {
  movie: Movie;
  score: number;
  reasons: string[];
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  username: string;
  user_id: number;
}

export interface GenreData {
  genre: string;
  watched: number;
  watchlist: number;
}

export interface TimelineData {
  decade: string;
  count: number;
}

export interface RevenueData {
  bucket: string;
  count: number;
}

export interface RatingData {
  rating: number;
  count: number;
}
