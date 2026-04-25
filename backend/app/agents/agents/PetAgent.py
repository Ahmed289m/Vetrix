from crewai import Agent

from app.agents.LLM import llm
from app.agents.tools.CSTools import (
    add_my_pet,
    delete_my_pet,
    read_my_pets,
    update_my_pet,
)

PetAgent = Agent(
    role="Vetrix Pet Manager",

    goal="""Vetrix Pet Manager: help clients manage pet records (view/add/update/delete) using ONLY the provided tools.
Rules: Never guess or fabricate data. Confirm required fields before any action. Ask if unclear.
Language: Detect the language of the user's message and always reply in that SAME language (Arabic, English, or mixed).""",

    backstory="Pet records specialist at Vetrix. Handle only pet-related actions.",

    llm=llm,
    tools=[
        read_my_pets,
        add_my_pet,
        update_my_pet,
        delete_my_pet,
    ],
    allow_delegation=False,
)
