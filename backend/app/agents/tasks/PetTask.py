from crewai import Task

from app.agents.agents.PetAgent import PetAgent

PetTask = Task(
    description="""
Request: {user_prompt}
Client: {client_id} | Clinic: {clinic_id}

LANGUAGE: Detect the language of the request above. Reply ENTIRELY in that same language.
If Arabic → reply fully in Arabic, transliterate English names (e.g. "ce" → "سي", "Max" → "ماكس").

client_id and clinic_id are auto-injected — do NOT pass them to any tool.

Function-calling safety rules:
- For add_my_pet, never call the tool unless name, weight, and pet_type are all present and non-empty.
- For update_my_pet, never call the tool unless pet_id is present and at least one field to update is provided.
- For delete_my_pet, never call the tool unless pet_id is present and user confirmed deletion.
- Use "" only for optional unchanged update fields (name/weight/pet_type in update_my_pet).

Tool routing (USE TOOLS ONLY — never fabricate):
- View pets → read_my_pets(action="fetch")
- Add pet → add_my_pet(name, weight, pet_type)
- Update pet → update_my_pet(pet_id, name, weight, pet_type)
- Delete pet (confirm pet_id with user first) → delete_my_pet(pet_id)
AVAILABLE TOOLS ONLY: read_my_pets, add_my_pet, update_my_pet, delete_my_pet. Do NOT call any other tool.
""",
    agent=PetAgent,
    expected_output="Short, friendly answer or action confirmation in the user's language, based on tool data only.",
    async_execution=False,
)
