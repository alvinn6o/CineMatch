from fastapi import APIRouter, Depends, HTTPException, status
import aiosqlite
from database import get_db
from auth import hash_password, verify_password, create_access_token
from dependencies import get_current_user
from models import UserRegister, UserLogin, TokenResponse, UserResponse

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(user: UserRegister, db: aiosqlite.Connection = Depends(get_db)):
    # Check if username or email already exists
    cursor = await db.execute(
        "SELECT id FROM users WHERE username = ? OR email = ?",
        (user.username, user.email),
    )
    if await cursor.fetchone():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered",
        )

    hashed = hash_password(user.password)
    cursor = await db.execute(
        "INSERT INTO users (username, email, hashed_password) VALUES (?, ?, ?)",
        (user.username, user.email, hashed),
    )
    await db.commit()
    user_id = cursor.lastrowid

    token = create_access_token(user_id, user.username)
    return TokenResponse(
        access_token=token,
        username=user.username,
        user_id=user_id,
    )


@router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(
        "SELECT id, username, hashed_password FROM users WHERE username = ?",
        (user.username,),
    )
    row = await cursor.fetchone()
    if not row or not verify_password(user.password, row["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_access_token(row["id"], row["username"])
    return TokenResponse(
        access_token=token,
        username=row["username"],
        user_id=row["id"],
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    cursor = await db.execute(
        "SELECT id, username, email FROM users WHERE id = ?",
        (current_user["id"],),
    )
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(id=row["id"], username=row["username"], email=row["email"])
