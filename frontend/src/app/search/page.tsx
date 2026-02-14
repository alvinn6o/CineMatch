"use client";

import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import api from "@/lib/api";
import { Movie, MovieSearchResult } from "@/lib/types";
import MovieCard from "@/components/MovieCard";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(
    async (q: string, p: number) => {
      if (!q.trim()) {
        setResults([]);
        setSearched(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get<MovieSearchResult>("/api/movies/search", {
          params: { q: q.trim(), page: p, limit: 20 },
        });
        setResults(res.data.movies);
        setTotal(res.data.total);
        setPages(res.data.pages);
        setSearched(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        setPage(1);
        search(query, 1);
      } else {
        setResults([]);
        setSearched(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    search(query, newPage);
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies by title..."
          autoFocus
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-12 pr-4 py-4 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="text-center text-gray-400 py-12">No movies found for &quot;{query}&quot;</p>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="text-sm text-gray-400 mb-4">
            {total} result{total !== 1 ? "s" : ""} found
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 border border-gray-700 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-800 transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-400">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pages}
                className="px-4 py-2 border border-gray-700 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-800 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {!loading && !searched && (
        <p className="text-center text-gray-500 py-12">Type to search for movies</p>
      )}
    </div>
  );
}
