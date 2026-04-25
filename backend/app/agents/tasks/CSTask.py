from crewai import Task
from app.agents.agents.CSAgent import CustomerServiceAgent

CustomerServiceTask = Task(
    description="""
    You are the Vetrix customer service assistant.

    Inputs:
    - user_prompt: {user_prompt}
    - client_id: {client_id}
    - clinic_id: {clinic_id}

    Rules:
    - Use tools only; do not guess or fabricate data.
    - First check allowed client actions based on {user_prompt} and {client_id} with client_allowed_actions.
    - If the user asks for information, use the matching read tool.
    - If the user asks to add, update, or delete something, collect missing required fields first.
    - Use the smallest tool needed for the request.
    - Return a short, clear answer with the result of the action or the requested information.
    - If the request is unclear, ask for clarification.

""",
    agent=CustomerServiceAgent,
    expected_output="""
    Return a clear and correct answer to the user prompt, and perform actions if user request in {user_prompt} that based on the data that you have access to through the tools.
    """,
    async_execution=False,
)
