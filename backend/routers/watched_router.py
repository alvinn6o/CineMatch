from fastapi import APIRouter, Depends, HTTPException, status
import aiosqlite
from database import get_db
from dependencies import get_current_user
from models import WatchedCreate, WatchedUpdate, WatchedResponse, MovieResponse

router = APIRouter()


@router.get("", response_model=list[WatchedResponse])
async def get_watched(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    cursor = await db.execute(
        """SELECT w.id, w.movie_id, w.rating, w.notes, w.watched_date, w.created_at,
                  m.id as m_id, m.title, m.original_title, m.overview, m.release_date,
                  m.runtime, m.vote_average, m.vote_count, m.popularity, m.revenue,
                  m.budget, m.original_language, m.genres, m.keywords,
                  m.production_companies, m.spoken_languages, m.poster_path,
                  m.backdrop_path, m.tagline, m.imdb_id
           FROM watched w JOIN movies m ON w.movie_id = m.id
           WHERE w.user_id = ?
           ORDER BY w.created_at DESC""",
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
        results.append(WatchedResponse(
            id=row["id"], movie_id=row["movie_id"], rating=row["rating"],
            notes=row["notes"], watched_date=row["watched_date"],
            created_at=row["created_at"], movie=movie,
        ))
    return results


@router.post("", response_model=WatchedResponse, status_code=status.HTTP_201_CREATED)
async def add_watched(
    data: WatchedCreate,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    # Verify movie exists
    cursor = await db.execute("SELECT id FROM movies WHERE id = ?", (data.movie_id,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Movie not found")

    # Remove from watchlist if present
    await db.execute(
        "DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?",
        (current_user["id"], data.movie_id),
    )

    try:
        cursor = await db.execute(
            """INSERT INTO watched (user_id, movie_id, rating, notes, watched_date)
               VALUES (?, ?, ?, ?, ?)""",
            (current_user["id"], data.movie_id, data.rating, data.notes, data.watched_date),
        )
        await db.commit()
    except aiosqlite.IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Movie already in watched list",
        )

    return WatchedResponse(
        id=cursor.lastrowid,
        movie_id=data.movie_id,
        rating=data.rating,
        notes=data.notes,
        watched_date=data.watched_date,
    )


@router.put("/{movie_id}", response_model=WatchedResponse)
async def update_watched(
    movie_id: int,
    data: WatchedUpdate,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    cursor = await db.execute(
        "SELECT id, rating, notes, watched_date, created_at FROM watched WHERE user_id = ? AND movie_id = ?",
        (current_user["id"], movie_id),
    )
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Movie not in watched list")

    new_rating = data.rating if data.rating is not None else row["rating"]
    new_notes = data.notes if data.notes is not None else row["notes"]

    await db.execute(
        """UPDATE watched SET rating = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ? AND movie_id = ?""",
        (new_rating, new_notes, current_user["id"], movie_id),
    )
    await db.commit()

    return WatchedResponse(
        id=row["id"], movie_id=movie_id, rating=new_rating,
        notes=new_notes, watched_date=row["watched_date"],
        created_at=row["created_at"],
    )


@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_watched(
    movie_id: int,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    cursor = await db.execute(
        "DELETE FROM watched WHERE user_id = ? AND movie_id = ?",
        (current_user["id"], movie_id),
    )
    await db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Movie not in watched list")
