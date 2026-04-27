from crewai import Task

from app.agents.agents.RouterAgent import RouterAgent

RouterTask = Task(
    description="""
Classify the client's request into exactly one intent category.

Client message: {user_prompt}
Client ID: {client_id}

Valid categories:
- pets         → the client wants to view, add, update, or delete their pets
- appointments → the client wants to view, book, or check his clinic appointments
- medical      → the client wants to view visits, prescriptions, medications, or drugs related to their pets.
- general      → greetings, unclear requests, or anything that does not fit the above.

Rules:
- Output ONLY the single category word in lowercase.
- Do not add any explanation, punctuation, or extra text.
- If in doubt, output: general
""",
    agent=RouterAgent,
    expected_output="A single lowercase word: pets | appointments | medical | general",
    async_execution=False,
)
