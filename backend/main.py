from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from services.recommendation_service import RecommendationEngine
from state import app_state


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    await init_db()

    # Load recommendation engine into memory
    print("Loading recommendation engine...")
    app_state["engine"] = RecommendationEngine()
    print(f"  Feature matrix: {app_state['engine'].feature_matrix.shape}")
    print("Ready!")

    yield

    app_state.clear()


app = FastAPI(title="Netflix Recommender API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from routers.auth_router import router as auth_router
from routers.movies_router import router as movies_router
from routers.watched_router import router as watched_router
from routers.watchlist_router import router as watchlist_router
from routers.recommendations_router import router as recommendations_router
from routers.analytics_router import router as analytics_router

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(movies_router, prefix="/api/movies", tags=["movies"])
app.include_router(watched_router, prefix="/api/watched", tags=["watched"])
app.include_router(watchlist_router, prefix="/api/watchlist", tags=["watchlist"])
app.include_router(recommendations_router, prefix="/api/recommendations", tags=["recommendations"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
