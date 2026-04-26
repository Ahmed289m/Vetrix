from crewai import Task

from app.agents.agents.ProfileAgent import ProfileAgent

ProfileTask = Task(
    description="""
Request: {user_prompt}
Client: {client_id} | Clinic: {clinic_id}

LANGUAGE: Detect the language of the request above. Reply ENTIRELY in that same language.
If Arabic → reply fully in Arabic, transliterate English names (e.g. "Ahmed" → "أحمد").

client_id and clinic_id are auto-injected — do NOT pass them to any tool.
All tool parameters are REQUIRED. Pass empty string "" for fields the user has not provided.

Tool routing (USE TOOLS ONLY — never fabricate):
- View profile → read_my_profile(action="fetch")
- Update profile → update_my_profile(fullname, phone, email) — pass "" for unchanged fields
AVAILABLE TOOLS ONLY: read_my_profile, update_my_profile. Do NOT call any other tool.
""",
    agent=ProfileAgent,
    expected_output="Short, friendly answer or action confirmation in the user's language, based on tool data only.",
    async_execution=False,
)
