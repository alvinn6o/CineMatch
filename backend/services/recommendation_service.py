import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import load_npz
from config import FEATURE_MATRIX_PATH, MOVIE_IDS_PATH


class RecommendationEngine:
    def __init__(self):
        self.feature_matrix = load_npz(str(FEATURE_MATRIX_PATH))
        self.movie_ids = np.load(str(MOVIE_IDS_PATH))
        self.id_to_idx = {int(mid): i for i, mid in enumerate(self.movie_ids)}

    def recommend(
        self,
        watched_movie_ids: list[int],
        watched_ratings: list[int],
        exclude_ids: set[int],
        limit: int = 20,
    ) -> list[dict]:
        if not watched_movie_ids:
            return []

        # row indices for watched movies
        indices = []
        ratings = []
        for mid, rating in zip(watched_movie_ids, watched_ratings):
            if mid in self.id_to_idx:
                indices.append(self.id_to_idx[mid])
                ratings.append(rating)

        if not indices:
            return []

        # normalize ratings to [0, 1] range
        weights = np.array([(r - 1) / 9.0 for r in ratings])
        if weights.sum() == 0:
            weights = np.ones(len(weights))

        # weighted user profile vector
        watched_vectors = self.feature_matrix[indices]
        user_vector = (watched_vectors.T @ weights) / weights.sum()

        # cosine similarity against all movies
        scores = cosine_similarity(
            user_vector.reshape(1, -1), self.feature_matrix
        ).flatten()

        # zero out watched and excluded movies
        for mid in exclude_ids:
            if mid in self.id_to_idx:
                scores[self.id_to_idx[mid]] = 0

        # top N
        top_indices = np.argsort(scores)[::-1][:limit]

        results = []
        for idx in top_indices:
            if scores[idx] <= 0:
                break
            results.append({
                "movie_id": int(self.movie_ids[idx]),
                "score": round(float(scores[idx]), 4),
            })

        return results

    def explain(
        self,
        movie_genres: str,
        movie_keywords: str,
        movie_language: str,
        movie_release_date: str,
        user_top_genres: list[str],
        user_top_keywords: list[str],
        user_languages: list[str],
        user_decades: list[str],
    ) -> list[str]:
        reasons = []

        # Genre overlap
        if movie_genres:
            movie_genre_set = {g.strip().lower() for g in movie_genres.split(",")}
            shared_genres = movie_genre_set & {g.lower() for g in user_top_genres}
            if shared_genres:
                formatted = ", ".join(sorted(g.title() for g in shared_genres))
                reasons.append(f"Similar genres: {formatted}")

        # Keyword overlap
        if movie_keywords:
            movie_kw_set = {k.strip().lower() for k in movie_keywords.split(",")}
            shared_kw = movie_kw_set & {k.lower() for k in user_top_keywords}
            if shared_kw:
                top_shared = sorted(shared_kw)[:3]
                formatted = ", ".join(k.title() for k in top_shared)
                reasons.append(f"Shared themes: {formatted}")

        # Language match
        if movie_language and movie_language.lower() in {l.lower() for l in user_languages}:
            lang_names = {"en": "English", "fr": "French", "es": "Spanish",
                          "de": "German", "ja": "Japanese", "ko": "Korean",
                          "zh": "Chinese", "hi": "Hindi", "it": "Italian",
                          "pt": "Portuguese", "ru": "Russian"}
            lang_display = lang_names.get(movie_language.lower(), movie_language.upper())
            reasons.append(f"Same language: {lang_display}")

        # Decade match
        if movie_release_date:
            try:
                year = int(movie_release_date[:4])
                decade = f"{(year // 10) * 10}s"
                if decade in user_decades or str((year // 10) * 10) in user_decades:
                    reasons.append(f"Same era: {decade}")
            except (ValueError, IndexError):
                pass

        if not reasons:
            reasons.append("Based on your overall taste profile")

        return reasons
