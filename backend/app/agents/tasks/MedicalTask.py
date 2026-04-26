from crewai import Task

from app.agents.agents.MedicalAgent import MedicalAgent

MedicalTask = Task(
    description="""
Request: {user_prompt}
Client: {client_id} | Clinic: {clinic_id}

client_id and clinic_id are auto-injected — do NOT pass them to any tool.

Tool routing (USE TOOLS ONLY — never fabricate):
- Visit history → read_my_visits (no args needed)
- Prescriptions → read_my_prescriptions (no args needed)
- Prescription items / medications → read_my_prescription_items (no args needed)
- Drug information → read_drugs (optional: drug_ids as comma-separated string)
AVAILABLE TOOLS ONLY: read_my_visits, read_my_prescriptions, read_my_prescription_items, read_drugs. Do NOT call any other tool.
""",
    agent=MedicalAgent,
    expected_output="Short, correct medical info based on tool data only.",
    async_execution=False,
)
