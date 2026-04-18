from crewai import Agent
from app.agents.LLM import llm
from app.agents.tools.InfoGettingTools import get_pet_visits

InfoAgent = Agent(
    role="get info agent",
    goal="get visits notes, medications, and the date of the visit for a pet based on the pet_id, you must use the get_pet_visits tool to get the visits info.",
    backstory="you are resposible for getting the visits based on the pet_id, visits notes, medications, and the date of the visit.",
    llm=llm,
    tools=[get_pet_visits],
)