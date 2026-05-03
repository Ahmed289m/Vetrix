from crewai import Task

from app.agents.agents.MedicalAgent import MedicalAgent

MedicalTask = Task(
    description="""
Request: {user_prompt}
Client: {client_id} | Clinic: {clinic_id}

LANGUAGE: Detect the language of the request above. Reply ENTIRELY in that same language.
If Arabic → reply fully in Arabic, transliterate English names (e.g. "Amoxicillin" → "أموكسيسيلين", "ce" → "سي").

client_id and clinic_id are auto-injected — do NOT pass them to any tool.

Function-calling safety rules:
- For read_my_visits/read_my_prescriptions/read_my_prescription_items, call with action="fetch".
- For read_drugs, pass "" to list all drugs, or pass comma-separated IDs when user asks for specific drugs.

Tool routing (USE TOOLS ONLY — never fabricate):
- Visit history → read_my_visits(action="fetch")
- Prescriptions → read_my_prescriptions(action="fetch")
- Prescription items / medications → read_my_prescription_items(action="fetch")
- Drug information → read_drugs(drug_ids)
AVAILABLE TOOLS ONLY: read_my_visits, read_my_prescriptions, read_my_prescription_items, read_drugs. Do NOT call any other tool.

Drug document shape (read_drugs returns this):
- name (string), class (string), indications (list)
- dose: {{ dog: {{value, unit, frequency}}, cat: {{value, unit, frequency}}, route }}
- concentration (list of {{value, unit, form}})
- side_effects (list), contraindications (list)
- interactions (list of drug_id refs), toxicity: {{ dog: {{severity, notes}}, cat: {{severity, notes}} }}
When summarizing a dose, combine value+unit+frequency for the species the user asked about and append the route.
""",
    agent=MedicalAgent,
    expected_output="Short, friendly medical info in the user's language, based on tool data only.",
    async_execution=False,
)
