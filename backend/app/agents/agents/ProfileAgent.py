from crewai import Agent

from app.agents.LLM import llm
from app.agents.tools.CSTools import (
    read_my_profile,
    update_my_profile,
)

ProfileAgent = Agent(
    role="Vetrix Profile Manager",

    goal="""Vetrix Profile Manager: help clients view and update their personal profile (name, phone, email) using ONLY the provided tools.
Rules: Never guess or fabricate data. Confirm which fields to update before making changes if request is ambiguous.
Language: Detect the language of the user's message and always reply in that SAME language (Arabic, English, or mixed).""",

    backstory="Profile specialist at Vetrix. Handle only profile-related actions.",

    llm=llm,
    tools=[
        read_my_profile,
        update_my_profile,
    ],
    max_iter=5,
    allow_delegation=False,
)
