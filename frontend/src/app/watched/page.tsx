"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, Star, Pencil, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { WatchedEntry } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import MovieCard from "@/components/MovieCard";
import RatingModal from "@/components/RatingModal";

export default function WatchedPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<WatchedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editEntry, setEditEntry] = useState<WatchedEntry | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "rating" | "title">("date");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchWatched();
    }
  }, [isAuthenticated, authLoading]);

  const fetchWatched = async () => {
    try {
      const res = await api.get<WatchedEntry[]>("/api/watched");
      setEntries(res.data);
    } catch {}
    setLoading(false);
  };

  const handleUpdate = async (rating: number, notes: string) => {
    if (!editEntry) return;
    try {
      await api.put(`/api/watched/${editEntry.movie_id}`, { rating, notes });
      setEntries((prev) =>
        prev.map((e) =>
          e.movie_id === editEntry.movie_id ? { ...e, rating, notes } : e
        )
      );
      setEditEntry(null);
    } catch {}
  };

  const handleRemove = async (movieId: number) => {
    try {
      await api.delete(`/api/watched/${movieId}`);
      setEntries((prev) => prev.filter((e) => e.movie_id !== movieId));
    } catch {}
  };

  const sorted = [...entries].sort((a, b) => {
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    if (sortBy === "title")
      return (a.movie?.title || "").localeCompare(b.movie?.title || "");
    return 0; // default: API order (date desc)
  });

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Eye className="w-6 h-6 text-green-500" />
          <h1 className="text-2xl font-bold">Watched</h1>
          <span className="text-gray-400 text-sm">({entries.length})</span>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300"
        >
          <option value="date">Recent</option>
          <option value="rating">Rating</option>
          <option value="title">Title</option>
        </select>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20">
          <Eye className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400">No watched movies yet</p>
          <button
            onClick={() => router.push("/search")}
            className="mt-3 text-red-400 hover:text-red-300 text-sm"
          >
            Search for movies to add
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sorted.map((entry) =>
            entry.movie ? (
              <MovieCard
                key={entry.movie_id}
                movie={entry.movie}
                userRating={entry.rating}
                actions={
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setEditEntry(entry);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-800 rounded text-xs text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      <Pencil className="w-3 h-3" /> Edit
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

      {editEntry && (
        <RatingModal
          movieTitle={editEntry.movie?.title || ""}
          initialRating={editEntry.rating}
          initialNotes={editEntry.notes || ""}
          onSubmit={handleUpdate}
          onClose={() => setEditEntry(null)}
        />
      )}
    </div>
  );
}
