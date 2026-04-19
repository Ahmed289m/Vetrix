from crewai import Task
from app.agents.agents.InfoAgent import InfoAgent
from app.agents.schemas.InfoOutput import InfoOutput

InfoGettingTask = Task(
    description="""
Follow these steps EXACTLY:

1. Use get_pet_visits(pet_id) to get visits.
2. If no visits found → return [].

For each visit:
3. Extract prescription_id.
4. Use get_prescription_by_id(prescription_id).
5. Extract prescriptionItem_ids.
6. Use get_prescription_items_by_ids(prescriptionItem_ids).
7. Extract drug_ids.
8. Use get_drugs_by_ids(drug_ids) to get drug names and dosage.

Return ONLY the data coming from tools.
Do NOT create or assume any missing values.
""",
    agent=InfoAgent,
    expected_output="""
Return a valid JSON matching this schema:

{
  "visits": [
    {
      "visit_notes": "string",
      "date": "string",
      "medications": [
        {
          "drug_name": "string",
          "dosage": "string"
        }
      ]
    }
  ]
}

Rules:
- If no data → return {"visits": []}
- No extra text.
- No explanations.
- No fake data.
""",
    async_execution=False,
    output_pydantic=InfoOutput,
)