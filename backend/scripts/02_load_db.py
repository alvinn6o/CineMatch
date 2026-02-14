"""
Step 2: Load cleaned Parquet into SQLite database.

Creates the full schema (users, movies, watched, watchlist tables)
and inserts movie data from the Parquet file.

Outputs: backend/data/app.db
"""

import sqlite3
import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
PARQUET_PATH = DATA_DIR / "movies_clean.parquet"
DB_PATH = DATA_DIR / "app.db"

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    original_title TEXT,
    overview TEXT,
    release_date TEXT,
    runtime INTEGER,
    vote_average REAL,
    vote_count INTEGER,
    popularity REAL,
    revenue INTEGER,
    budget INTEGER,
    original_language TEXT,
    genres TEXT,
    keywords TEXT,
    production_companies TEXT,
    spoken_languages TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    tagline TEXT,
    imdb_id TEXT
);

CREATE TABLE IF NOT EXISTS watched (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    movie_id INTEGER NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 10),
    notes TEXT,
    watched_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    UNIQUE(user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    movie_id INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    UNIQUE(user_id, movie_id)
);
"""


def main():
    print(f"Reading {PARQUET_PATH}...")
    df = pd.read_parquet(PARQUET_PATH)
    print(f"  Loaded {len(df)} movies")

    # Connect to SQLite
    conn = sqlite3.connect(DB_PATH)

    # Create schema
    conn.executescript(SCHEMA_SQL)
    print("  Created tables")

    # Insert movies
    df.to_sql("movies", conn, if_exists="replace", index=False)
    print(f"  Inserted {len(df)} movies")

    # Create indexes
    conn.execute("CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title COLLATE NOCASE)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_movies_popularity ON movies(popularity DESC)")
    conn.commit()
    print("  Created indexes")

    # Recreate user tables (since to_sql replace drops them)
    conn.executescript(SCHEMA_SQL)
    conn.commit()

    # Verify
    cursor = conn.execute("SELECT COUNT(*) FROM movies")
    count = cursor.fetchone()[0]
    print(f"\nDatabase ready at {DB_PATH}")
    print(f"  Movies in DB: {count}")
    print(f"  DB size: {DB_PATH.stat().st_size / 1024 / 1024:.1f} MB")

    conn.close()


if __name__ == "__main__":
    main()
