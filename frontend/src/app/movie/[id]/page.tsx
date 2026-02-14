"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star, Clock, Globe, Eye, Bookmark, BookmarkCheck, Pencil, Trash2, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { Movie, WatchedEntry, WatchlistEntry } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import RatingModal from "@/components/RatingModal";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w1280";

export default function MovieDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchedEntry, setWatchedEntry] = useState<WatchedEntry | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const movieRes = await api.get<Movie>(`/api/movies/${id}`);
        setMovie(movieRes.data);

        if (isAuthenticated) {
          const [watchedRes, watchlistRes] = await Promise.all([
            api.get<WatchedEntry[]>("/api/watched"),
            api.get<WatchlistEntry[]>("/api/watchlist"),
          ]);
          const found = watchedRes.data.find((w) => w.movie_id === Number(id));
          if (found) setWatchedEntry(found);
          const inWl = watchlistRes.data.some((w) => w.movie_id === Number(id));
          setInWatchlist(inWl);
        }
      } catch {
        // Movie not found
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isAuthenticated]);

  const addToWatched = async (rating: number, notes: string) => {
    setActionLoading(true);
    try {
      await api.post("/api/watched", { movie_id: Number(id), rating, notes });
      setWatchedEntry({ id: 0, movie_id: Number(id), rating, notes });
      setInWatchlist(false);
      setShowRatingModal(false);
    } catch {}
    setActionLoading(false);
  };

  const updateWatched = async (rating: number, notes: string) => {
    setActionLoading(true);
    try {
      await api.put(`/api/watched/${id}`, { rating, notes });
      setWatchedEntry((prev) => prev && { ...prev, rating, notes });
      setEditMode(false);
    } catch {}
    setActionLoading(false);
  };

  const removeWatched = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/api/watched/${id}`);
      setWatchedEntry(null);
    } catch {}
    setActionLoading(false);
  };

  const addToWatchlist = async () => {
    setActionLoading(true);
    try {
      await api.post("/api/watchlist", { movie_id: Number(id) });
      setInWatchlist(true);
    } catch {}
    setActionLoading(false);
  };

  const removeFromWatchlist = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/api/watchlist/${id}`);
      setInWatchlist(false);
    } catch {}
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  if (!movie) {
    return <p className="text-center text-gray-400 py-20">Movie not found</p>;
  }

  const genres = movie.genres?.split(",").map((g) => g.trim()) || [];
  const year = movie.release_date?.slice(0, 4);
  const revenue = movie.revenue && movie.revenue > 0
    ? `$${(movie.revenue / 1_000_000).toFixed(1)}M`
    : null;
  const budget = movie.budget && movie.budget > 0
    ? `$${(movie.budget / 1_000_000).toFixed(1)}M`
    : null;

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-gray-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Backdrop */}
      {movie.backdrop_path && (
        <div className="relative h-64 md:h-80 rounded-xl overflow-hidden mb-6">
          <img
            src={`${TMDB_BACKDROP}${movie.backdrop_path}`}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent" />
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Poster */}
        <div className="flex-shrink-0">
          {movie.poster_path ? (
            <img
              src={`${TMDB_IMG}${movie.poster_path}`}
              alt={movie.title}
              className="w-48 rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-48 h-72 bg-gray-800 rounded-lg flex items-center justify-center text-gray-600">
              No Poster
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
          {movie.tagline && (
            <p className="text-gray-400 italic mb-3">&quot;{movie.tagline}&quot;</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-400">
            {year && <span>{year}</span>}
            {movie.runtime ? (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {movie.runtime} min
              </span>
            ) : null}
            {movie.vote_average ? (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                {movie.vote_average.toFixed(1)} ({movie.vote_count?.toLocaleString()} votes)
              </span>
            ) : null}
            {movie.original_language && (
              <span className="flex items-center gap-1">
                <Globe className="w-4 h-4" /> {movie.original_language.toUpperCase()}
              </span>
            )}
          </div>

          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {genres.map((g) => (
                <span key={g} className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                  {g}
                </span>
              ))}
            </div>
          )}

          {movie.overview && <p className="text-gray-300 mb-4 leading-relaxed">{movie.overview}</p>}

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            {revenue && (
              <div>
                <span className="text-gray-500">Revenue:</span>{" "}
                <span className="text-green-400">{revenue}</span>
              </div>
            )}
            {budget && (
              <div>
                <span className="text-gray-500">Budget:</span>{" "}
                <span className="text-gray-300">{budget}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {isAuthenticated && (
            <div className="flex flex-wrap gap-3">
              {watchedEntry ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400">
                    <Eye className="w-4 h-4" />
                    Watched - {watchedEntry.rating}/10
                  </div>
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={removeWatched}
                    disabled={actionLoading}
                    className="flex items-center gap-1 px-3 py-2 border border-red-500/30 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowRatingModal(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm text-white transition-colors"
                >
                  <Eye className="w-4 h-4" /> Add to Watched
                </button>
              )}

              {!watchedEntry && (
                inWatchlist ? (
                  <button
                    onClick={removeFromWatchlist}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-400 transition-colors"
                  >
                    <BookmarkCheck className="w-4 h-4" /> In Watchlist
                  </button>
                ) : (
                  <button
                    onClick={addToWatchlist}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    <Bookmark className="w-4 h-4" /> Add to Watchlist
                  </button>
                )
              )}
            </div>
          )}

          {watchedEntry?.notes && (
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-400">
                <span className="text-gray-500">Your notes:</span> {watchedEntry.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {(showRatingModal || editMode) && (
        <RatingModal
          movieTitle={movie.title}
          initialRating={editMode ? watchedEntry?.rating : 7}
          initialNotes={editMode ? watchedEntry?.notes || "" : ""}
          onSubmit={editMode ? updateWatched : addToWatched}
          onClose={() => {
            setShowRatingModal(false);
            setEditMode(false);
          }}
        />
      )}
    </div>
  );
}
