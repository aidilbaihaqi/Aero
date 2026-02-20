from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(description="Alamat email")
    password: str = Field(description="Password")
    remember_me: bool = Field(default=False, description="Ingat sesi lebih lama (30 hari)")


class UserOut(BaseModel):
    id: int
    email: str
    name: str

    class Config:
        from_attributes = True


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
