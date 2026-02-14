from pydantic import BaseModel, EmailStr
from typing import Optional


# Auth
class UserRegister(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    user_id: int


class UserResponse(BaseModel):
    id: int
    username: str
    email: str


# Movies
class MovieResponse(BaseModel):
    id: int
    title: str
    original_title: Optional[str] = None
    overview: Optional[str] = None
    release_date: Optional[str] = None
    runtime: Optional[int] = None
    vote_average: Optional[float] = None
    vote_count: Optional[int] = None
    popularity: Optional[float] = None
    revenue: Optional[int] = None
    budget: Optional[int] = None
    original_language: Optional[str] = None
    genres: Optional[str] = None
    keywords: Optional[str] = None
    production_companies: Optional[str] = None
    spoken_languages: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    tagline: Optional[str] = None
    imdb_id: Optional[str] = None


class MovieSearchResult(BaseModel):
    movies: list[MovieResponse]
    total: int
    page: int
    pages: int


# Watched
class WatchedCreate(BaseModel):
    movie_id: int
    rating: int
    notes: Optional[str] = None
    watched_date: Optional[str] = None


class WatchedUpdate(BaseModel):
    rating: Optional[int] = None
    notes: Optional[str] = None


class WatchedResponse(BaseModel):
    id: int
    movie_id: int
    rating: Optional[int] = None
    notes: Optional[str] = None
    watched_date: Optional[str] = None
    created_at: Optional[str] = None
    movie: Optional[MovieResponse] = None


# Watchlist
class WatchlistCreate(BaseModel):
    movie_id: int


class WatchlistResponse(BaseModel):
    id: int
    movie_id: int
    added_at: Optional[str] = None
    movie: Optional[MovieResponse] = None


# Move to watched
class MoveToWatchedRequest(BaseModel):
    rating: int
    notes: Optional[str] = None


# Recommendations
class RecommendationReason(BaseModel):
    text: str


class RecommendationItem(BaseModel):
    movie: MovieResponse
    score: float
    reasons: list[str]


class RecommendationsResponse(BaseModel):
    recommendations: list[RecommendationItem]


# Analytics
class GenreAnalytics(BaseModel):
    data: list[dict]


class TimelineAnalytics(BaseModel):
    data: list[dict]


class RevenueAnalytics(BaseModel):
    data: list[dict]


class RatingAnalytics(BaseModel):
    data: list[dict]
