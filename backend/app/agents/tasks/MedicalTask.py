from crewai import Task

from app.agents.agents.MedicalAgent import MedicalAgent

MedicalTask = Task(
    description="""
Request: {user_prompt}
Client: {client_id} | Clinic: {clinic_id}

client_id and clinic_id are auto-injected — do NOT pass them to any tool.
All tool parameters are REQUIRED. Pass empty string "" for fields the user has not provided.

Tool routing (USE TOOLS ONLY — never fabricate):
- Visit history → read_my_visits(action="fetch")
- Prescriptions → read_my_prescriptions(action="fetch")
- Prescription items / medications → read_my_prescription_items(action="fetch")
- Drug information → read_drugs(drug_ids) — pass "" to list all, or comma-separated IDs to filter
AVAILABLE TOOLS ONLY: read_my_visits, read_my_prescriptions, read_my_prescription_items, read_drugs. Do NOT call any other tool.
""",
    agent=MedicalAgent,
    expected_output="Short, correct medical info based on tool data only.",
    async_execution=False,
)
