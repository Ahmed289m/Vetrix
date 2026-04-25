from crewai import LLM
from app.core.config import settings


llm = LLM(
    model="gemini/gemini-2.5-flash",
    api_key=settings.gemini_api_key,
    temperature=0.7,
    top_p=0.9,
    top_k=40,  
    max_output_tokens=8192,
    stop_sequences=["END", "STOP"],
    stream=True,  
   
)