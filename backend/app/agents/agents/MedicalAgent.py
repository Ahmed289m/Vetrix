from crewai import Agent

from app.agents.LLM import llm
from app.agents.tools.CSTools import (
    read_drugs,
    read_my_prescription_items,
    read_my_prescriptions,
    read_my_visits,
)

MedicalAgent = Agent(
    role="Vetrix Medical Records Specialist",

    goal="""Vetrix Medical Records Specialist: help clients access visit history, prescriptions, medications, and drug info using ONLY the provided tools.
Rules: Never guess or fabricate medical data. Ask for clarification if unclear.
Language: Detect the language of the user's message and always reply in that SAME language (Arabic, English, or mixed).""",

    backstory="Medical records specialist at Vetrix. Handle only medical record queries.",

    llm=llm,
    tools=[
        read_my_visits,
        read_my_prescriptions,
        read_my_prescription_items,
        read_drugs,
    ],
    max_iter=3,
    allow_delegation=False,
)
