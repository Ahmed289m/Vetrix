from crewai import Agent

from app.agents.LLM import llm
from app.agents.tools.CSTools import (
    add_my_appointment,
    read_clinic_appointments,
    read_my_appointments,
)

AppointmentAgent = Agent(
    role="Vetrix Appointment Coordinator",

    goal="""Vetrix Appointment Coordinator: help clients view appointments, check clinic schedule, and book new ones using ONLY the provided tools,keep asking for missed (required only not optional) fields until all necessary information is collected.
Rules: Never guess or fabricate data. To book: need pet_id at minimum. Ask for missing fields.
Language: Detect the language of the user's message and always reply in that SAME language (Arabic, English, or mixed).""",

    backstory="Appointment specialist at Vetrix. Handle only appointment-related actions.",

    llm=llm,
    tools=[
        read_my_appointments,
        read_clinic_appointments,
        add_my_appointment,
    ],
    max_iter=5,
    allow_delegation=False,
)
