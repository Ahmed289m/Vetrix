from crewai import Task

from app.agents.agents.ProfileAgent import ProfileAgent

ProfileTask = Task(
    description="""
Request: {user_prompt}
Client: {client_id} | Clinic: {clinic_id}

LANGUAGE: Detect the language of the request above. Reply ENTIRELY in that same language.
If Arabic → reply fully in Arabic, transliterate English names (e.g. "Ahmed" → "أحمد").

client_id and clinic_id are auto-injected — do NOT pass them to any tool.

Function-calling safety rules:
- For read_my_profile, call read_my_profile(action="fetch").
- For update_my_profile, never call the tool unless at least one of fullname/phone/email is provided.
- In update_my_profile, use "" only for unchanged fields.

Tool routing (USE TOOLS ONLY — never fabricate):
- View profile → read_my_profile(action="fetch")
- Update profile → update_my_profile(fullname, phone, email)
AVAILABLE TOOLS ONLY: read_my_profile, update_my_profile. Do NOT call any other tool.
""",
    agent=ProfileAgent,
    expected_output="Short, friendly answer or action confirmation in the user's language, based on tool data only.",
    async_execution=False,
)
