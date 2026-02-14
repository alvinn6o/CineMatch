from fastapi import APIRouter, Depends
import aiosqlite
from database import get_db
from dependencies import get_current_user
from collections import Counter

router = APIRouter()


@router.get("/genres")
async def genre_analytics(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    # Watched genres
    cursor = await db.execute(
        """SELECT m.genres FROM watched w
           JOIN movies m ON w.movie_id = m.id
           WHERE w.user_id = ?""",
        (current_user["id"],),
    )
    watched_rows = await cursor.fetchall()
    watched_genres = Counter()
    for row in watched_rows:
        if row["genres"]:
            for g in row["genres"].split(","):
                watched_genres[g.strip()] += 1

    # Watchlist genres
    cursor = await db.execute(
        """SELECT m.genres FROM watchlist wl
           JOIN movies m ON wl.movie_id = m.id
           WHERE wl.user_id = ?""",
        (current_user["id"],),
    )
    watchlist_rows = await cursor.fetchall()
    watchlist_genres = Counter()
    for row in watchlist_rows:
        if row["genres"]:
            for g in row["genres"].split(","):
                watchlist_genres[g.strip()] += 1

    all_genres = sorted(set(watched_genres.keys()) | set(watchlist_genres.keys()))
    data = [
        {
            "genre": g,
            "watched": watched_genres.get(g, 0),
            "watchlist": watchlist_genres.get(g, 0),
        }
        for g in all_genres
    ]
    # Sort by total count descending
    data.sort(key=lambda x: x["watched"] + x["watchlist"], reverse=True)

    return {"data": data}


@router.get("/timeline")
async def timeline_analytics(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    cursor = await db.execute(
        """SELECT m.release_date FROM watched w
           JOIN movies m ON w.movie_id = m.id
           WHERE w.user_id = ? AND m.release_date IS NOT NULL""",
        (current_user["id"],),
    )
    rows = await cursor.fetchall()
    decade_counter = Counter()
    for row in rows:
        try:
            year = int(row["release_date"][:4])
            decade = f"{(year // 10) * 10}s"
            decade_counter[decade] += 1
        except (ValueError, IndexError, TypeError):
            pass

    data = [{"decade": d, "count": c} for d, c in sorted(decade_counter.items())]
    return {"data": data}


@router.get("/revenue")
async def revenue_analytics(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    cursor = await db.execute(
        """SELECT m.revenue FROM watched w
           JOIN movies m ON w.movie_id = m.id
           WHERE w.user_id = ? AND m.revenue > 0""",
        (current_user["id"],),
    )
    rows = await cursor.fetchall()

    buckets = {
        "< $10M": 0,
        "$10M - $50M": 0,
        "$50M - $100M": 0,
        "$100M - $500M": 0,
        "$500M - $1B": 0,
        "> $1B": 0,
    }
    for row in rows:
        rev = row["revenue"]
        if rev < 10_000_000:
            buckets["< $10M"] += 1
        elif rev < 50_000_000:
            buckets["$10M - $50M"] += 1
        elif rev < 100_000_000:
            buckets["$50M - $100M"] += 1
        elif rev < 500_000_000:
            buckets["$100M - $500M"] += 1
        elif rev < 1_000_000_000:
            buckets["$500M - $1B"] += 1
        else:
            buckets["> $1B"] += 1

    data = [{"bucket": k, "count": v} for k, v in buckets.items()]
    return {"data": data}


@router.get("/ratings")
async def rating_analytics(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    cursor = await db.execute(
        "SELECT rating, COUNT(*) as count FROM watched WHERE user_id = ? AND rating IS NOT NULL GROUP BY rating ORDER BY rating",
        (current_user["id"],),
    )
    rows = await cursor.fetchall()

    # Ensure all ratings 1-10 are represented
    rating_map = {row["rating"]: row["count"] for row in rows}
    data = [{"rating": r, "count": rating_map.get(r, 0)} for r in range(1, 11)]

    return {"data": data}
