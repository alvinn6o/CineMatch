"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Eye, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { WatchlistEntry } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import MovieCard from "@/components/MovieCard";
import RatingModal from "@/components/RatingModal";

export default function WatchlistPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [moveEntry, setMoveEntry] = useState<WatchlistEntry | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchWatchlist();
    }
  }, [isAuthenticated, authLoading]);

  const fetchWatchlist = async () => {
    try {
      const res = await api.get<WatchlistEntry[]>("/api/watchlist");
      setEntries(res.data);
    } catch {}
    setLoading(false);
  };

  const handleRemove = async (movieId: number) => {
    try {
      await api.delete(`/api/watchlist/${movieId}`);
      setEntries((prev) => prev.filter((e) => e.movie_id !== movieId));
    } catch {}
  };

  const handleMoveToWatched = async (rating: number, notes: string) => {
    if (!moveEntry) return;
    try {
      await api.post(`/api/watchlist/${moveEntry.movie_id}/move-to-watched`, {
        rating,
        notes,
      });
      setEntries((prev) => prev.filter((e) => e.movie_id !== moveEntry.movie_id));
      setMoveEntry(null);
    } catch {}
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Bookmark className="w-6 h-6 text-yellow-500" />
        <h1 className="text-2xl font-bold">Watchlist</h1>
        <span className="text-gray-400 text-sm">({entries.length})</span>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20">
          <Bookmark className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400">Your watchlist is empty</p>
          <button
            onClick={() => router.push("/search")}
            className="mt-3 text-red-400 hover:text-red-300 text-sm"
          >
            Search for movies to add
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {entries.map((entry) =>
            entry.movie ? (
              <MovieCard
                key={entry.movie_id}
                movie={entry.movie}
                actions={
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setMoveEntry(entry);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600/20 rounded text-xs text-green-400 hover:bg-green-600/30 transition-colors"
                    >
                      <Eye className="w-3 h-3" /> Watched
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemove(entry.movie_id);
                      }}
                      className="px-2 py-1.5 bg-gray-800 rounded text-xs text-red-400 hover:bg-gray-700 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                }
              />
            ) : null
          )}
        </div>
      )}

      {moveEntry && (
        <RatingModal
          movieTitle={moveEntry.movie?.title || ""}
          onSubmit={handleMoveToWatched}
          onClose={() => setMoveEntry(null)}
        />
      )}
    </div>
  );
}
