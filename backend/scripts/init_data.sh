#!/bin/sh
# Skip if artifacts already exist (from a previous run via volume persistence)
if [ -f /app/data/app.db ] && [ -f /app/data/feature_matrix.npz ]; then
    echo "Data artifacts already exist, skipping pipeline."
    exit 0
fi

echo "Running data pipeline..."
python scripts/01_clean_csv.py
python scripts/02_load_db.py
python scripts/03_build_features.py
echo "Data pipeline complete."
