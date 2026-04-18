from crewai import Task
from app.agents.agents.InfoAgent import InfoAgent
from app.agents.schemas.InfoOutput import InfoOutput
from app.agents.tools.InfoGettingTools import get_pet_visits

InfoGettingTask = Task(
  description="you are given a pet_id: {pet_id} and then you will use the tool 'Get Pet Visits' to get visits notes, medications and the date of the visit for a pet based on the pet_id.",
    agent=InfoAgent,
    expected_output="""
Return a valid JSON array of visits like this:
[
  {
    "notes": "...",
    "medications": "...",
    "date": "d/m/yyyy"
  }
]
""",
    async_execution=False,
    output_pydantic=InfoOutput,
)