from fastapi import APIRouter, Depends, HTTPException, status
import aiosqlite
from database import get_db
from dependencies import get_current_user
from models import WatchlistCreate, WatchlistResponse, WatchedResponse, MoveToWatchedRequest, MovieResponse

router = APIRouter()


@router.get("", response_model=list[WatchlistResponse])
async def get_watchlist(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    cursor = await db.execute(
        """SELECT wl.id, wl.movie_id, wl.added_at,
                  m.id as m_id, m.title, m.original_title, m.overview, m.release_date,
                  m.runtime, m.vote_average, m.vote_count, m.popularity, m.revenue,
                  m.budget, m.original_language, m.genres, m.keywords,
                  m.production_companies, m.spoken_languages, m.poster_path,
                  m.backdrop_path, m.tagline, m.imdb_id
           FROM watchlist wl JOIN movies m ON wl.movie_id = m.id
           WHERE wl.user_id = ?
           ORDER BY wl.added_at DESC""",
        (current_user["id"],),
    )
    rows = await cursor.fetchall()
    results = []
    for row in rows:
        movie = MovieResponse(
            id=row["m_id"], title=row["title"], original_title=row["original_title"],
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
        results.append(WatchlistResponse(
            id=row["id"], movie_id=row["movie_id"],
            added_at=row["added_at"], movie=movie,
        ))
    return results


@router.post("", response_model=WatchlistResponse, status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    data: WatchlistCreate,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    # Verify movie exists
    cursor = await db.execute("SELECT id FROM movies WHERE id = ?", (data.movie_id,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Movie not found")

    # Check if already watched
    cursor = await db.execute(
        "SELECT id FROM watched WHERE user_id = ? AND movie_id = ?",
        (current_user["id"], data.movie_id),
    )
    if await cursor.fetchone():
        raise HTTPException(status_code=409, detail="Movie already in watched list")

    try:
        cursor = await db.execute(
            "INSERT INTO watchlist (user_id, movie_id) VALUES (?, ?)",
            (current_user["id"], data.movie_id),
        )
        await db.commit()
    except aiosqlite.IntegrityError:
        raise HTTPException(status_code=409, detail="Movie already in watchlist")

    return WatchlistResponse(id=cursor.lastrowid, movie_id=data.movie_id)


@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_watchlist(
    movie_id: int,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    cursor = await db.execute(
        "DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?",
        (current_user["id"], movie_id),
    )
    await db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Movie not in watchlist")


@router.post("/{movie_id}/move-to-watched", response_model=WatchedResponse)
async def move_to_watched(
    movie_id: int,
    data: MoveToWatchedRequest,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    # Verify it's in watchlist
    cursor = await db.execute(
        "SELECT id FROM watchlist WHERE user_id = ? AND movie_id = ?",
        (current_user["id"], movie_id),
    )
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Movie not in watchlist")

    # Remove from watchlist
    await db.execute(
        "DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?",
        (current_user["id"], movie_id),
    )

    # Add to watched
    cursor = await db.execute(
        """INSERT INTO watched (user_id, movie_id, rating, notes)
           VALUES (?, ?, ?, ?)""",
        (current_user["id"], movie_id, data.rating, data.notes),
    )
    await db.commit()

    return WatchedResponse(
        id=cursor.lastrowid,
        movie_id=movie_id,
        rating=data.rating,
        notes=data.notes,
    )
