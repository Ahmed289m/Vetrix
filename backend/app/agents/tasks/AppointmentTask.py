from crewai import Task

from app.agents.agents.AppointmentAgent import AppointmentAgent

AppointmentTask = Task(
    description="""
Request: {user_prompt}
Client: {client_id}
Clinic: {clinic_id}




Function-calling safety rules:
- Never call add_my_appointment unless pet_id is provided and non-empty.
- If pet_id is missing, ask a short clarifying question instead of calling any write tool.
- appointment_date, reason, and doctor_id are optional. For unknown optional fields, pass "".
- appointment_date accepts ISO or natural phrases like "today", "tomorrow", "النهارده", "بكره".


    
""",
    agent=AppointmentAgent,
    expected_output="Short, friendly answer or action confirmation in the user's language, based on tool data only.",
    async_execution=False,
)
