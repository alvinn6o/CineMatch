"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Film, Search, Eye, Sparkles, BarChart3, ArrowRight } from "lucide-react";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: "/search", label: "Search Movies", icon: Search, desc: "Find and discover movies", color: "blue" },
            { href: "/watched", label: "Watched", icon: Eye, desc: "Your rated movies", color: "green" },
            { href: "/recommendations", label: "For You", icon: Sparkles, desc: "Personalized picks", color: "purple" },
            { href: "/analytics", label: "Analytics", icon: BarChart3, desc: "Your movie stats", color: "orange" },
          ].map(({ href, label, icon: Icon, desc, color }) => (
            <Link
              key={href}
              href={href}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors group"
            >
              <Icon className={`w-8 h-8 mb-3 text-${color}-500`} />
              <h2 className="font-semibold mb-1 group-hover:text-red-400 transition-colors flex items-center gap-1">
                {label}
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>
              <p className="text-sm text-gray-400">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <Film className="w-16 h-16 text-red-500 mb-6" />
      <h1 className="text-4xl font-bold mb-4">CineMatch</h1>
      <p className="text-gray-400 text-lg mb-8 max-w-md">
        Track your watched movies, get personalized recommendations, and explore your movie analytics.
      </p>
      <div className="flex gap-3">
        <Link
          href="/register"
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="border border-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
