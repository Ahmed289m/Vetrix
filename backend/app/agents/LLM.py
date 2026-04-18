from langchain_groq import ChatGroq
from app.core.config import settings


llm = ChatGroq(
    model="llama-3.1-70b-versatile",
    api_key=settings.groq_api_key,
)