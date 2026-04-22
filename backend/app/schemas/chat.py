from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=10_000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5_000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=50)
    context: str | None = Field(default=None, max_length=50)


class ChatResponse(BaseModel):
    response: str
