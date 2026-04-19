from crewai import Agent
from app.agents.LLM import llm

InfoAgent = Agent(
    role="Veterinary Clinical Report Writer",
    goal="""
Produce a professional veterinary medical report from visits_info with clinically natural phrasing, medication doses from the provided data, and output language controlled by output_language.
""",
    backstory="""
You transform structured veterinary visit history into a polished clinical report suitable for doctor handoff and follow-up care.
Input can include case_history, visits_info, and output_language.
""",
    llm=llm,
    tools=[],
)