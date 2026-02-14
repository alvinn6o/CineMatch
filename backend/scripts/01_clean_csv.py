"""
Step 1: Clean raw TMDB CSV and output a filtered Parquet file.

Filters:
- status == 'Released'
- vote_count >= 1
- has genres
- not adult content

Outputs: backend/data/movies_clean.parquet (~200k rows)
"""

import pandas as pd
from pathlib import Path

# Check Docker mount point first, then fall back to local dev path
_DOCKER_CSV = Path("/app/TMDB_movie_dataset_v11.csv")
_LOCAL_CSV = Path(__file__).resolve().parent.parent.parent / "TMDB_movie_dataset_v11.csv"
RAW_CSV = _DOCKER_CSV if _DOCKER_CSV.exists() else _LOCAL_CSV
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data"
OUTPUT_PATH = OUTPUT_DIR / "movies_clean.parquet"


def main():
    print(f"Reading {RAW_CSV}...")
    df = pd.read_csv(RAW_CSV, low_memory=False)
    print(f"  Raw rows: {len(df)}")

    # Filter to usable movies
    df = df[df["status"] == "Released"]
    print(f"  After status=Released: {len(df)}")

    df = df[df["vote_count"] >= 1]
    print(f"  After vote_count>=1: {len(df)}")

    df = df[df["genres"].notna() & (df["genres"].str.strip() != "")]
    print(f"  After has genres: {len(df)}")

    # Exclude adult content
    df = df[df["adult"].astype(str).str.lower() != "true"]
    print(f"  After excluding adult: {len(df)}")

    # Clean numeric columns
    for col in ["revenue", "budget"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)
    df["runtime"] = pd.to_numeric(df["runtime"], errors="coerce").fillna(0).astype(int)
    df["vote_average"] = pd.to_numeric(df["vote_average"], errors="coerce").fillna(0.0)
    df["vote_count"] = pd.to_numeric(df["vote_count"], errors="coerce").fillna(0).astype(int)
    df["popularity"] = pd.to_numeric(df["popularity"], errors="coerce").fillna(0.0)

    # Clean date
    df["release_date"] = pd.to_datetime(df["release_date"], errors="coerce").dt.strftime("%Y-%m-%d")

    # Fill NaN text fields
    text_cols = [
        "keywords", "production_companies", "overview", "tagline",
        "poster_path", "backdrop_path", "imdb_id", "spoken_languages",
        "original_title", "original_language",
    ]
    for col in text_cols:
        df[col] = df[col].fillna("")

    # Drop unnecessary columns
    df = df.drop(columns=["adult", "status", "homepage", "production_countries"], errors="ignore")

    # Sort by popularity, take top 200k for dev performance
    df = df.sort_values("popularity", ascending=False).head(200_000)
    df = df.reset_index(drop=True)

    # Save
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    df.to_parquet(OUTPUT_PATH, index=False)
    print(f"\nSaved {len(df)} movies to {OUTPUT_PATH}")
    print(f"Columns: {list(df.columns)}")
    print(f"File size: {OUTPUT_PATH.stat().st_size / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
