from crewai import Task

from app.agents.agents.AppointmentAgent import AppointmentAgent

AppointmentTask = Task(
    description="""
Request: {user_prompt}
Client: {client_id} | Clinic: {clinic_id}

Tool routing (USE TOOLS ONLY — never fabricate):
- View own appointments → read_my_appointments
- Check clinic schedule → read_clinic_appointments
- Book appointment (need: pet_id; date/reason/doctor optional) → add_my_appointment
""",
    agent=AppointmentAgent,
    expected_output="Short, correct answer or action confirmation based on tool data only.",
    async_execution=False,
)
