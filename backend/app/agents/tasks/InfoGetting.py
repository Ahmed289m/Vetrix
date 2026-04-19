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
- Write as a professional veterinary medical report in narrative prose.
- Present visits in chronological clinical style.
- For each visit, include date, clinical findings, assessment, and medications.
- Mention medication doses as provided in the input data.
- Keep wording concise and medically clear.
- Do not use label-like phrasing such as "key note is" or "medications are".
- Use natural clinical sentences and smooth transitions between visits.
- If no visits exist, return: No case history available.

Use only provided input data.
""",
    agent=InfoAgent,
    expected_output="""
Return a concise, professional veterinary report text that covers all visits.
""",
    async_execution=False,
)