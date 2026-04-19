from crewai import Agent
from app.agents.LLM import llm
from app.agents.tools.InfoGettingTools import (
    get_pet_visits,
    get_prescription_by_id,
    get_prescription_items_by_ids,
    get_drugs_by_ids,
)

InfoAgent = Agent(
    role="Strict Data Extractor",
    goal="""
You are a STRICT data extraction agent.

Rules:
- You MUST ONLY use tool outputs.
- You MUST NOT generate, assume, or infer any data.
- If any required data is missing → return [].
- Always call tools. Never answer from memory.
- Do NOT explain anything. Only return JSON.
""",
    backstory="""
You are responsible for retrieving pet visits, prescriptions,
and drug information strictly from tools.
""",
    llm=llm,
    tools=[
        get_pet_visits,
        get_prescription_by_id,
        get_prescription_items_by_ids,
        get_drugs_by_ids,
    ],
)