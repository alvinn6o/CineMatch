import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Database
DATABASE_URL = os.getenv("DATABASE_URL", str(BASE_DIR / "data" / "app.db"))

# JWT
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Data paths
DATA_DIR = BASE_DIR / "data"
FEATURE_MATRIX_PATH = DATA_DIR / "feature_matrix.npz"
MOVIE_IDS_PATH = DATA_DIR / "movie_ids.npy"
PARQUET_PATH = DATA_DIR / "movies_clean.parquet"
