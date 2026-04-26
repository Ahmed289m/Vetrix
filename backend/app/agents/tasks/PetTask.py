from crewai import Task

from app.agents.agents.PetAgent import PetAgent

PetTask = Task(
    description="""
Request: {user_prompt}
Client: {client_id} | Clinic: {clinic_id}

client_id and clinic_id are auto-injected — do NOT pass them to any tool.

Tool routing (USE TOOLS ONLY — never fabricate):
- View pets → read_my_pets (no args needed)
- Add pet (need: name, weight, pet_type) → add_my_pet
- Update pet (need: pet_id + fields to change) → update_my_pet
- Delete pet (confirm pet_id with user first) → delete_my_pet
AVAILABLE TOOLS ONLY: read_my_pets, add_my_pet, update_my_pet, delete_my_pet. Do NOT call any other tool.
""",
    agent=PetAgent,
    expected_output="Short, correct answer or action confirmation based on tool data only.",
    async_execution=False,
)
