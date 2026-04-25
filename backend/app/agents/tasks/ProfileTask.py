from crewai import Task

from app.agents.agents.ProfileAgent import ProfileAgent

ProfileTask = Task(
    description="""
You are the Vetrix Profile Manager. Handle the client's profile-related request.

Inputs:
- user_prompt : {user_prompt}
- client_id   : {client_id}
- clinic_id   : {clinic_id}

Rules:
- Use tools only; do not guess or fabricate profile data.
- If the user wants to view their profile → use read_my_profile.
- If the user wants to update their profile:
    * Collect which fields to change (fullname, phone, and/or email) if not already in the message.
    * Confirm what will be updated before proceeding when the request is ambiguous.
    * Then call update_my_profile.
- Return a short, clear answer with the result of the action or the requested information.
- If the request is unclear, ask for clarification.
""",
    agent=ProfileAgent,
    expected_output="""
A clear, correct answer to the user's profile-related request based on
data retrieved or actions performed using tools.
""",
    async_execution=False,
)
