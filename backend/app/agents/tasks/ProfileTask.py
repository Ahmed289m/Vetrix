from crewai import Task

from app.agents.agents.ProfileAgent import ProfileAgent

ProfileTask = Task(
    description="""
Request: {user_prompt}
Client: {client_id} | Clinic: {clinic_id}

client_id and clinic_id are auto-injected — do NOT pass them to any tool.

Tool routing (USE TOOLS ONLY — never fabricate):
- View profile → read_my_profile (no args needed)
- Update profile (confirm fields: fullname/phone/email if ambiguous) → update_my_profile
AVAILABLE TOOLS ONLY: read_my_profile, update_my_profile. Do NOT call any other tool.
""",
    agent=ProfileAgent,
    expected_output="Short, correct answer or action confirmation based on tool data only.",
    async_execution=False,
)
