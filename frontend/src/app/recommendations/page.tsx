"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Bookmark, Star } from "lucide-react";
import api from "@/lib/api";
import { RecommendationItem } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

const TMDB_IMG = "https://image.tmdb.org/t/p/w300";

export default function RecommendationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [recs, setRecs] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToWatchlist, setAddingToWatchlist] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchRecs();
    }
  }, [isAuthenticated, authLoading]);

  const fetchRecs = async () => {
    try {
      const res = await api.get("/api/recommendations", { params: { limit: 20 } });
      setRecs(res.data.recommendations);
    } catch {}
    setLoading(false);
  };

  const addToWatchlist = async (movieId: number) => {
    setAddingToWatchlist((prev) => new Set(prev).add(movieId));
    try {
      await api.post("/api/watchlist", { movie_id: movieId });
      setRecs((prev) => prev.filter((r) => r.movie.id !== movieId));
    } catch {}
    setAddingToWatchlist((prev) => {
      const next = new Set(prev);
      next.delete(movieId);
      return next;
    });
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
        <Sparkles className="w-6 h-6 text-purple-500" />
        <h1 className="text-2xl font-bold">Recommended For You</h1>
      </div>

      {recs.length === 0 ? (
        <div className="text-center py-20">
          <Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400">
            Rate some movies first to get personalized recommendations
          </p>
          <button
            onClick={() => router.push("/search")}
            className="mt-3 text-red-400 hover:text-red-300 text-sm"
          >
            Search for movies to rate
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {recs.map((rec, idx) => (
            <div
              key={rec.movie.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-4 hover:border-gray-700 transition-colors"
            >
              <span className="text-2xl font-bold text-gray-700 w-8 flex-shrink-0 pt-1">
                {idx + 1}
              </span>

              <Link href={`/movie/${rec.movie.id}`} className="flex-shrink-0">
                {rec.movie.poster_path ? (
                  <img
                    src={`${TMDB_IMG}${rec.movie.poster_path}`}
                    alt={rec.movie.title}
                    className="w-20 h-30 object-cover rounded-lg"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-20 h-30 bg-gray-800 rounded-lg" />
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/movie/${rec.movie.id}`}>
                  <h2 className="font-semibold text-lg hover:text-red-400 transition-colors">
                    {rec.movie.title}
                  </h2>
                </Link>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                  <span>{rec.movie.release_date?.slice(0, 4)}</span>
                  {rec.movie.vote_average ? (
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      {rec.movie.vote_average.toFixed(1)}
                    </span>
                  ) : null}
                  <span className="text-purple-400 font-medium">
                    {(rec.score * 100).toFixed(0)}% match
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {rec.reasons.map((reason, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300"
                    >
                      {reason}
                    </span>
                  ))}
                </div>

                {rec.movie.overview && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {rec.movie.overview}
                  </p>
                )}
              </div>

              <button
                onClick={() => addToWatchlist(rec.movie.id)}
                disabled={addingToWatchlist.has(rec.movie.id)}
                className="flex-shrink-0 self-center px-3 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
                title="Add to watchlist"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
