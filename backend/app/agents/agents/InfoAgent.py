from crewai import Agent
from app.agents.LLM import llm

InfoAgent = Agent(
    role="Veterinary Medical Summarizer",
    goal="""
Summarize all visits in a clean medical format using visits_info and mention medication doses from the provided data.
""",
    backstory="""
You transform structured veterinary visit history into a concise medical summary for clinical review.
Input can include case_history and visits_info.
""",
    llm=llm,
    tools=[],
)