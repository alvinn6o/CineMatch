"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { Movie } from "@/lib/types";

const TMDB_IMG = "https://image.tmdb.org/t/p/w300";

interface MovieCardProps {
  movie: Movie;
  userRating?: number;
  actions?: React.ReactNode;
}

export default function MovieCard({ movie, userRating, actions }: MovieCardProps) {
  const year = movie.release_date?.slice(0, 4) || "";
  const genres = movie.genres?.split(",").slice(0, 2).map((g) => g.trim()) || [];

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-colors group">
      <Link href={`/movie/${movie.id}`}>
        <div className="aspect-[2/3] relative bg-gray-800">
          {movie.poster_path ? (
            <img
              src={`${TMDB_IMG}${movie.poster_path}`}
              alt={movie.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <Film className="w-12 h-12" />
            </div>
          )}
          {userRating && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-current" />
              {userRating}
            </div>
          )}
        </div>
      </Link>
      <div className="p-3">
        <Link href={`/movie/${movie.id}`}>
          <h3 className="font-medium text-sm truncate hover:text-red-400 transition-colors">
            {movie.title}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
          {year && <span>{year}</span>}
          {movie.vote_average ? (
            <span className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              {movie.vote_average.toFixed(1)}
            </span>
          ) : null}
        </div>
        {genres.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {genres.map((g) => (
              <span key={g} className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">
                {g}
              </span>
            ))}
          </div>
        )}
        {actions && <div className="mt-2">{actions}</div>}
      </div>
    </div>
  );
}

function Film({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
      <line x1="17" y1="17" x2="22" y2="17" />
    </svg>
  );
}
