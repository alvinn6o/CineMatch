"""
Step 3: Build feature matrix for the recommendation engine.

Creates a sparse TF-IDF feature matrix from movie metadata:
- Genres (weight 3.0) - HIGH importance
- Keywords (weight 2.0) - MEDIUM importance
- Original language (weight 2.0) - MEDIUM importance
- Release decade (weight 1.5) - LOW-MEDIUM importance

Outputs:
  - backend/data/feature_matrix.npz  (sparse matrix)
  - backend/data/movie_ids.npy       (movie ID array matching matrix rows)
"""

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from scipy.sparse import hstack, save_npz
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
PARQUET_PATH = DATA_DIR / "movies_clean.parquet"


def comma_tokenizer(text):
    """Split comma-separated text into stripped, lowered tokens."""
    if not text or pd.isna(text):
        return []
    return [t.strip().lower() for t in text.split(",") if t.strip()]


def main():
    print(f"Reading {PARQUET_PATH}...")
    df = pd.read_parquet(PARQUET_PATH)
    print(f"  {len(df)} movies loaded")

    # 1. Genre features (HIGH weight)
    print("Building genre features...")
    genre_tfidf = TfidfVectorizer(
        tokenizer=comma_tokenizer,
        token_pattern=None,
        lowercase=False,
    )
    genre_matrix = genre_tfidf.fit_transform(df["genres"].fillna("")) * 3.0
    print(f"  Genres: {genre_matrix.shape[1]} features")

    # 2. Keyword features (MEDIUM weight)
    print("Building keyword features...")
    keyword_tfidf = TfidfVectorizer(
        tokenizer=comma_tokenizer,
        token_pattern=None,
        lowercase=False,
        max_features=5000,
    )
    keyword_matrix = keyword_tfidf.fit_transform(df["keywords"].fillna("")) * 2.0
    print(f"  Keywords: {keyword_matrix.shape[1]} features")

    # 3. Language features (MEDIUM weight)
    print("Building language features...")
    lang_tfidf = TfidfVectorizer()
    lang_matrix = lang_tfidf.fit_transform(df["original_language"].fillna("")) * 2.0
    print(f"  Languages: {lang_matrix.shape[1]} features")

    # 4. Decade features (LOW-MEDIUM weight)
    print("Building decade features...")
    release_dates = pd.to_datetime(df["release_date"], errors="coerce")
    decades = (release_dates.dt.year // 10 * 10).fillna(0).astype(int).astype(str)
    decade_tfidf = TfidfVectorizer()
    decade_matrix = decade_tfidf.fit_transform(decades) * 1.5
    print(f"  Decades: {decade_matrix.shape[1]} features")

    # 5. Stack all features
    print("Stacking feature matrix...")
    feature_matrix = hstack([genre_matrix, keyword_matrix, lang_matrix, decade_matrix]).tocsr()
    print(f"  Final matrix shape: {feature_matrix.shape}")
    print(f"  Non-zero entries: {feature_matrix.nnz}")

    # 6. Save
    save_npz(str(DATA_DIR / "feature_matrix.npz"), feature_matrix)
    np.save(str(DATA_DIR / "movie_ids.npy"), df["id"].values)

    fm_size = (DATA_DIR / "feature_matrix.npz").stat().st_size / 1024 / 1024
    print(f"\nSaved feature_matrix.npz ({fm_size:.1f} MB)")
    print(f"Saved movie_ids.npy ({len(df)} IDs)")


if __name__ == "__main__":
    main()
