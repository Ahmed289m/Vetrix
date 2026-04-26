from crewai import Task

from app.agents.agents.AppointmentAgent import AppointmentAgent

AppointmentTask = Task(
    description="""
Request: {user_prompt}
Client: {client_id} | Clinic: {clinic_id}

LANGUAGE: Detect the language of the request above. Reply ENTIRELY in that same language.
If Arabic → reply fully in Arabic, transliterate English names (e.g. "ce" → "سي", "Max" → "ماكس").

client_id and clinic_id are auto-injected — do NOT pass them to any tool.
All tool parameters are REQUIRED. Pass empty string "" for fields the user has not provided.

Tool routing (USE TOOLS ONLY — never fabricate):
- View own appointments → read_my_appointments(action="fetch")
- Check clinic schedule → read_clinic_appointments(action="fetch")
- Book appointment → add_my_appointment(pet_id, appointment_date, reason, doctor_id) — pass "" for unknown fields
AVAILABLE TOOLS ONLY: read_my_appointments, read_clinic_appointments, add_my_appointment. Do NOT call any other tool.
""",
    agent=AppointmentAgent,
    expected_output="Short, friendly answer or action confirmation in the user's language, based on tool data only.",
    async_execution=False,
)
