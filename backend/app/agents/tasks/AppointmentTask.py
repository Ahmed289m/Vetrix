from crewai import Task

from app.agents.agents.AppointmentAgent import AppointmentAgent

AppointmentTask = Task(
    description="""
Request: {user_prompt}
Client: {client_id} | Clinic: {clinic_id}

LANGUAGE: Detect the language of the request above. Reply ENTIRELY in that same language.
If Arabic → reply fully in Arabic, transliterate English names (e.g. "ce" → "سي", "Max" → "ماكس").

client_id and clinic_id are auto-injected — do NOT pass them to any tool.

Function-calling safety rules:
- Never call add_my_appointment unless pet_id is provided and non-empty.
- If pet_id is missing, ask a short clarifying question instead of calling any write tool.
- appointment_date, reason, and doctor_id are optional. For unknown optional fields, pass "".

Tool routing (USE TOOLS ONLY — never fabricate):
- View own appointments → read_my_appointments(action="fetch")
- Check clinic schedule → read_clinic_appointments(action="fetch")
- Book appointment:
    - If pet_id exists → add_my_appointment(pet_id, appointment_date, reason, doctor_id)
    - If pet_id is missing → ask user for pet_id first (no tool call)
AVAILABLE TOOLS ONLY: read_my_appointments, read_clinic_appointments, add_my_appointment. Do NOT call any other tool.
""",
    agent=AppointmentAgent,
    expected_output="Short, friendly answer or action confirmation in the user's language, based on tool data only.",
    async_execution=False,
)
