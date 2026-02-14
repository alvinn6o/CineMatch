# CineMatch — Movie Recommendation & Analytics Platform

A full-stack web application that delivers **personalized, explainable movie recommendations** and **interactive viewing analytics** powered by content-based machine learning. Built on the TMDB Movies Dataset (~930K movies).

---

## Main Objectives

1. **Personalized Recommendations** — Suggest movies tailored to each user's taste using content-based filtering (TF-IDF + cosine similarity), with human-readable explanations for every recommendation.
2. **Viewing Analytics** — Provide interactive visualizations so users can explore patterns in their watched and watchlisted movies (genre distribution, release timeline, revenue breakdown, rating habits).
3. **Movie Tracking** — Let users search a catalog of 200K movies, rate them 1–10 with notes, and maintain a watchlist for future viewing.
4. **User Accounts** — Secure registration and login with JWT authentication and bcrypt password hashing.

---

## Methodology

### Data Pipeline

The raw TMDB dataset (~930K rows, ~582 MB CSV) is processed through a three-stage pipeline:
1. Cleans data, filters out movies not currently released, non-adult movies with at least 1 vote and genres. Keeps top 200k by popularity. Outputs a clean parquet file for speed
2. Load the SQLite tables: users, movies, watched, watchlist
3. Build TF-IDF feature matrix and saves as feature_matrix.npz and movie_id.npy 


### Recommendation Algorithm

Content-based filtering using **TF-IDF vectorization** and **cosine similarity**:

1. **Feature extraction** — Each movie is represented as a sparse vector built from four weighted dimensions:
   - Genres (weight 3.0)
   - Keywords (weight 2.0)
   - Original language (weight 2.0)
   - Release decade (weight 1.5)

2. **User profile construction** — A user's watched movies are averaged into a single profile vector, weighted by their normalized ratings (`(rating - 1) / 9`). Higher-rated movies have more influence.

3. **Similarity scoring** — Cosine similarity is computed between the user profile and every movie in the catalog. Already-watched and watchlisted movies are excluded.

4. **Explainability** — Each recommendation includes up to 4 reasons (e.g., "Similar genres: Thriller, Drama", "Same era: 2010s") by matching the recommended movie's features against the user's top preferences.

### Tech Stack


| Backend | FastAPI, Python 3, Uvicorn |
| Frontend | Next.js 14, React 18, TypeScript, TailwindCSS |
| Database | SQLite (aiosqlite) |
| ML / Data | scikit-learn, SciPy, Pandas, NumPy, PyArrow |
| Auth | JWT (python-jose), bcrypt |
| Visualizations | Recharts |


## Features

### Movie Search & Discovery
- Search 200K movies by title with results sorted by popularity
- Paginated results with real-time debounced search
- Detailed movie pages with poster, backdrop, synopsis, metadata, and revenue/budget info

### Watched List
- Rate movies 1–10 and add optional notes
- Edit or remove ratings at any time
- Sort by recent, rating, or title

### Watchlist
- Save movies to watch later
- Move directly from watchlist to watched with a rating in one step

### Recommendations ("For You")
- Up to 20 personalized suggestions per request
- Match percentage score for each recommendation
- Explanation badges showing why each movie was recommended
- Add recommendations straight to watchlist

### Analytics Dashboard
Four interactive charts built with Recharts:

| Chart | Type | Shows |
|-------|------|-------|
| Genre Distribution | Horizontal bar | Top 12 genres, watched vs. watchlist side-by-side |
| Release Timeline | Area | Movie counts by decade |
| Revenue Distribution | Bar | Watched movies bucketed by revenue (<$10M to >$1B) |
| Your Ratings | Bar | Distribution of user ratings 1–10 |

---

## Overall Outcomes

- **End-to-end ML pipeline** — Raw CSV to cleaned Parquet to TF-IDF feature matrix to real-time recommendations, all reproducible via three scripts.
- **Explainable AI** — Every recommendation comes with human-readable reasons, increasing transparency and trust.
- **Responsive, modern UI** — Dark-themed interface with movie posters, interactive star ratings, and four analytics visualizations.
- **Scalable architecture** — FastAPI async backend with sparse matrix computations handles 200K movies efficiently. Frontend uses Next.js with client-side routing.
- **Secure by default** — Passwords hashed with bcrypt, API protected with JWT tokens (7-day expiry), CORS restricted to the frontend origin.

---

## Project Structure

```
netflix_project/
├── README.md
├── backend/
│   ├── main.py                 # FastAPI app, routes, startup
│   ├── models.py               # Pydantic response schemas
│   ├── database.py             # SQLite schema and connection
│   ├── auth.py                 # JWT and password hashing
│   ├── dependencies.py         # Auth middleware
│   ├── config.py               # Paths and constants
│   ├── requirements.txt
│   ├── routers/
│   │   ├── auth_router.py
│   │   ├── movies_router.py
│   │   ├── watched_router.py
│   │   ├── watchlist_router.py
│   │   ├── recommendations_router.py
│   │   └── analytics_router.py
│   ├── services/
│   │   └── recommendation_service.py   # TF-IDF recommendation engine
│   ├── scripts/
│   │   ├── 01_clean_csv.py
│   │   ├── 02_load_db.py
│   │   └── 03_build_features.py
│   └── data/                   # Generated data (gitignored)
│       ├── movies_clean.parquet
│       ├── app.db
│       ├── feature_matrix.npz
│       └── movie_ids.npy
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.ts
    └── src/
        ├── app/
        │   ├── page.tsx                # Home / dashboard
        │   ├── search/page.tsx
        │   ├── watched/page.tsx
        │   ├── watchlist/page.tsx
        │   ├── recommendations/page.tsx
        │   ├── analytics/page.tsx
        │   ├── movie/[id]/page.tsx
        │   ├── login/page.tsx
        │   └── register/page.tsx
        ├── components/
        │   ├── MovieCard.tsx
        │   ├── Navbar.tsx
        │   └── RatingModal.tsx
        └── lib/
            ├── api.ts          # Axios instance
            ├── auth.tsx        # Auth context and hooks
            └── types.ts        # TypeScript interfaces
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- The TMDB dataset CSV (place in project root as `TMDB_movie_dataset_v11.csv`)

### Backend Setup
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Run the data pipeline
python scripts/01_clean_csv.py
python scripts/02_load_db.py
python scripts/03_build_features.py

# Start the API server
uvicorn main:app --reload


### Frontend Setup

cd frontend
npm install
npm run dev


The frontend runs at `http://localhost:3000` and the backend API at `http://localhost:8000`.

---

## Data Source

[TMDB Movies Dataset (Kaggle)](https://www.kaggle.com/datasets/asaniczka/tmdb-movies-dataset-2023-930k-movies) — ~930K movies with metadata including genres, keywords, revenue, language, and more.
