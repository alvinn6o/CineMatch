"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";

interface RatingModalProps {
  movieTitle: string;
  initialRating?: number;
  initialNotes?: string;
  onSubmit: (rating: number, notes: string) => void;
  onClose: () => void;
}

export default function RatingModal({
  movieTitle,
  initialRating = 7,
  initialNotes = "",
  onSubmit,
  onClose,
}: RatingModalProps) {
  const [rating, setRating] = useState(initialRating);
  const [notes, setNotes] = useState(initialNotes);
  const [hoveredRating, setHoveredRating] = useState(0);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Rate Movie</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-4 truncate">{movieTitle}</p>

        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Rating</label>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoveredRating(n)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-6 h-6 ${
                    n <= (hoveredRating || rating)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-600"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-1">{rating}/10</p>
        </div>

        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-2 block">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What did you think?"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(rating, notes)}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm text-white transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
