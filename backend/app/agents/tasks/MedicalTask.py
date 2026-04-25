from crewai import Task

from app.agents.agents.MedicalAgent import MedicalAgent

MedicalTask = Task(
    description="""
Request: {user_prompt}
Client: {client_id} | Clinic: {clinic_id}

Tool routing (USE TOOLS ONLY — never fabricate):
- Visit history → read_my_visits
- Prescriptions → read_my_prescriptions
- Prescription items / medications → read_my_prescription_items
- Drug information → read_drugs
""",
    agent=MedicalAgent,
    expected_output="Short, correct medical info based on tool data only.",
    async_execution=False,
)
