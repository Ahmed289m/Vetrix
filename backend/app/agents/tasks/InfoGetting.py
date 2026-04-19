from crewai import Task
from app.agents.agents.InfoAgent import InfoAgent

InfoGettingTask = Task(
    description="""
Input data:

visits_info:
{visits_info}

case_history:
{case_history}

Summarize all visits in a medical shape:
- Present visits in chronological clinical style.
- For each visit, include date, key note, and medications.
- Mention medication doses as provided in the input data.
- Keep wording concise and medically clear.
- If no visits exist, return: No case history available.

Use only provided input data.
""",
    agent=InfoAgent,
    expected_output="""
Return a concise medical summary text that covers all visits.
""",
    async_execution=False,
)