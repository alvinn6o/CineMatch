from fastapi import APIRouter, Depends, Query
import aiosqlite
from database import get_db
from dependencies import get_current_user
from models import RecommendationsResponse, RecommendationItem, MovieResponse
from state import app_state

router = APIRouter()


@router.get("", response_model=RecommendationsResponse)
async def get_recommendations(
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    engine = app_state["engine"]

    # Get user's watched movies with ratings
    cursor = await db.execute(
        "SELECT movie_id, rating FROM watched WHERE user_id = ?",
        (current_user["id"],),
    )
    watched_rows = await cursor.fetchall()

    if not watched_rows:
        return RecommendationsResponse(recommendations=[])

    watched_ids = [row["movie_id"] for row in watched_rows]
    watched_ratings = [row["rating"] for row in watched_rows]

    # Get watchlist IDs to also exclude
    cursor = await db.execute(
        "SELECT movie_id FROM watchlist WHERE user_id = ?",
        (current_user["id"],),
    )
    watchlist_rows = await cursor.fetchall()
    watchlist_ids = [row["movie_id"] for row in watchlist_rows]

    exclude_ids = set(watched_ids) | set(watchlist_ids)

    # Get recommendations
    recs = engine.recommend(watched_ids, watched_ratings, exclude_ids, limit)

    if not recs:
        return RecommendationsResponse(recommendations=[])

    # Build user taste profile for explanations
    cursor = await db.execute(
        """SELECT m.genres, m.keywords, m.original_language, m.release_date
           FROM watched w JOIN movies m ON w.movie_id = m.id
           WHERE w.user_id = ?""",
        (current_user["id"],),
    )
    profile_rows = await cursor.fetchall()

    # Aggregate user preferences
    from collections import Counter
    genre_counter = Counter()
    keyword_counter = Counter()
    lang_counter = Counter()
    decade_counter = Counter()

    for row in profile_rows:
        if row["genres"]:
            for g in row["genres"].split(","):
                genre_counter[g.strip()] += 1
        if row["keywords"]:
            for k in row["keywords"].split(","):
                keyword_counter[k.strip()] += 1
        if row["original_language"]:
            lang_counter[row["original_language"]] += 1
        if row["release_date"]:
            try:
                year = int(row["release_date"][:4])
                decade_counter[f"{(year // 10) * 10}s"] += 1
            except (ValueError, IndexError):
                pass

    user_top_genres = [g for g, _ in genre_counter.most_common(10)]
    user_top_keywords = [k for k, _ in keyword_counter.most_common(20)]
    user_languages = [l for l, _ in lang_counter.most_common(3)]
    user_decades = [d for d, _ in decade_counter.most_common(3)]

    # Fetch movie details and build response
    rec_movie_ids = [r["movie_id"] for r in recs]
    placeholders = ",".join("?" * len(rec_movie_ids))
    cursor = await db.execute(
        f"""SELECT id, title, original_title, overview, release_date, runtime,
                   vote_average, vote_count, popularity, revenue, budget,
                   original_language, genres, keywords, production_companies,
                   spoken_languages, poster_path, backdrop_path, tagline, imdb_id
            FROM movies WHERE id IN ({placeholders})""",
        rec_movie_ids,
    )
    movie_rows = await cursor.fetchall()
    movie_map = {row["id"]: row for row in movie_rows}

    recommendations = []
    for rec in recs:
        row = movie_map.get(rec["movie_id"])
        if not row:
            continue

        movie = MovieResponse(
            id=row["id"], title=row["title"], original_title=row["original_title"],
            overview=row["overview"], release_date=row["release_date"],
            runtime=row["runtime"], vote_average=row["vote_average"],
            vote_count=row["vote_count"], popularity=row["popularity"],
            revenue=row["revenue"], budget=row["budget"],
            original_language=row["original_language"], genres=row["genres"],
            keywords=row["keywords"], production_companies=row["production_companies"],
            spoken_languages=row["spoken_languages"], poster_path=row["poster_path"],
            backdrop_path=row["backdrop_path"], tagline=row["tagline"],
            imdb_id=row["imdb_id"],
        )

        reasons = engine.explain(
            movie_genres=row["genres"] or "",
            movie_keywords=row["keywords"] or "",
            movie_language=row["original_language"] or "",
            movie_release_date=row["release_date"] or "",
            user_top_genres=user_top_genres,
            user_top_keywords=user_top_keywords,
            user_languages=user_languages,
            user_decades=user_decades,
        )

        recommendations.append(RecommendationItem(
            movie=movie,
            score=rec["score"],
            reasons=reasons,
        ))

    return RecommendationsResponse(recommendations=recommendations)
