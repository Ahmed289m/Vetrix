from crewai import Task

from app.agents.agents.PetAgent import PetAgent

PetTask = Task(
    description="""
Request: {user_prompt}
Client: {client_id} | Clinic: {clinic_id}

client_id and clinic_id are auto-injected — do NOT pass them to any tool.
All tool parameters are REQUIRED. Pass empty string "" for fields the user has not provided.

Tool routing (USE TOOLS ONLY — never fabricate):
- View pets → read_my_pets(action="fetch")
- Add pet → add_my_pet(name, weight, pet_type) — all three required
- Update pet → update_my_pet(pet_id, name, weight, pet_type) — pass "" for unchanged fields
- Delete pet (confirm pet_id with user first) → delete_my_pet(pet_id)
AVAILABLE TOOLS ONLY: read_my_pets, add_my_pet, update_my_pet, delete_my_pet. Do NOT call any other tool.
""",
    agent=PetAgent,
    expected_output="Short, correct answer or action confirmation based on tool data only.",
    async_execution=False,
)
