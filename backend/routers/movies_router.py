from fastapi import APIRouter, Depends, HTTPException, Query
import aiosqlite
from database import get_db
from models import MovieResponse, MovieSearchResult

router = APIRouter()

MOVIE_COLUMNS = """id, title, original_title, overview, release_date, runtime,
    vote_average, vote_count, popularity, revenue, budget, original_language,
    genres, keywords, production_companies, spoken_languages,
    poster_path, backdrop_path, tagline, imdb_id"""


def row_to_movie(row) -> MovieResponse:
    return MovieResponse(
        id=row["id"],
        title=row["title"],
        original_title=row["original_title"],
        overview=row["overview"],
        release_date=row["release_date"],
        runtime=row["runtime"],
        vote_average=row["vote_average"],
        vote_count=row["vote_count"],
        popularity=row["popularity"],
        revenue=row["revenue"],
        budget=row["budget"],
        original_language=row["original_language"],
        genres=row["genres"],
        keywords=row["keywords"],
        production_companies=row["production_companies"],
        spoken_languages=row["spoken_languages"],
        poster_path=row["poster_path"],
        backdrop_path=row["backdrop_path"],
        tagline=row["tagline"],
        imdb_id=row["imdb_id"],
    )


@router.get("/search", response_model=MovieSearchResult)
async def search_movies(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: aiosqlite.Connection = Depends(get_db),
):
    offset = (page - 1) * limit
    search_term = f"%{q}%"

    # Count total matches
    cursor = await db.execute(
        "SELECT COUNT(*) FROM movies WHERE title LIKE ? COLLATE NOCASE",
        (search_term,),
    )
    total = (await cursor.fetchone())[0]

    # Get paginated results
    cursor = await db.execute(
        f"""SELECT {MOVIE_COLUMNS} FROM movies
            WHERE title LIKE ? COLLATE NOCASE
            ORDER BY popularity DESC
            LIMIT ? OFFSET ?""",
        (search_term, limit, offset),
    )
    rows = await cursor.fetchall()
    movies = [row_to_movie(row) for row in rows]

    return MovieSearchResult(
        movies=movies,
        total=total,
        page=page,
        pages=(total + limit - 1) // limit if total > 0 else 0,
    )


@router.get("/popular", response_model=MovieSearchResult)
async def popular_movies(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: aiosqlite.Connection = Depends(get_db),
):
    offset = (page - 1) * limit

    cursor = await db.execute("SELECT COUNT(*) FROM movies")
    total = (await cursor.fetchone())[0]

    cursor = await db.execute(
        f"""SELECT {MOVIE_COLUMNS} FROM movies
            ORDER BY popularity DESC
            LIMIT ? OFFSET ?""",
        (limit, offset),
    )
    rows = await cursor.fetchall()
    movies = [row_to_movie(row) for row in rows]

    return MovieSearchResult(
        movies=movies,
        total=total,
        page=page,
        pages=(total + limit - 1) // limit if total > 0 else 0,
    )


@router.get("/{movie_id}", response_model=MovieResponse)
async def get_movie(movie_id: int, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(
        f"SELECT {MOVIE_COLUMNS} FROM movies WHERE id = ?",
        (movie_id,),
    )
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Movie not found")
    return row_to_movie(row)
