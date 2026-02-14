"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";
import api from "@/lib/api";
import { GenreData, TimelineData, RevenueData, RatingData } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [genres, setGenres] = useState<GenreData[]>([]);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchAnalytics();
    }
  }, [isAuthenticated, authLoading]);

  const fetchAnalytics = async () => {
    try {
      const [genreRes, timeRes, revRes, ratingRes] = await Promise.all([
        api.get("/api/analytics/genres"),
        api.get("/api/analytics/timeline"),
        api.get("/api/analytics/revenue"),
        api.get("/api/analytics/ratings"),
      ]);
      setGenres(genreRes.data.data);
      setTimeline(timeRes.data.data);
      setRevenue(revRes.data.data);
      setRatings(ratingRes.data.data);
    } catch {}
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  const hasData = genres.length > 0 || timeline.length > 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 className="w-6 h-6 text-orange-500" />
        <h1 className="text-2xl font-bold">Analytics</h1>
      </div>

      {!hasData ? (
        <div className="text-center py-20">
          <BarChart3 className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400">
            Add movies to your watched list to see analytics
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Genre Distribution */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Genre Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={genres.slice(0, 12)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="genre"
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="watched" fill="#EF4444" name="Watched" radius={[0, 4, 4, 0]} />
                <Bar dataKey="watchlist" fill="#F59E0B" name="Watchlist" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Release Timeline */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Release Timeline</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="decade"
                  tick={{ fill: "#9CA3AF", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.2}
                  name="Movies"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Distribution */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Revenue Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="bucket"
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="#10B981" name="Movies" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Rating Distribution */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Your Ratings</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="rating"
                  tick={{ fill: "#9CA3AF", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="#F59E0B" name="Count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
