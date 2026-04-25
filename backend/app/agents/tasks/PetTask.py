from crewai import Task

from app.agents.agents.PetAgent import PetAgent

PetTask = Task(
    description="""
Request: {user_prompt}
Client: {client_id} | Clinic: {clinic_id}

Tool routing (USE TOOLS ONLY — never fabricate):
- View pets → read_my_pets
- Add pet (need: name, weight, pet_type) → add_my_pet
- Update pet (need: pet_id + fields to change) → update_my_pet
- Delete pet (confirm pet_id with user first) → delete_my_pet
""",
    agent=PetAgent,
    expected_output="Short, correct answer or action confirmation based on tool data only.",
    async_execution=False,
)
