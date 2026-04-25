from crewai import Agent
from app.agents.LLM import llm
from app.agents.tools.CSTools import (
    add_my_appointment,
    add_my_pet,
    client_allowed_actions,
    delete_my_pet,
    read_clinic_appointments,
    read_drugs,
    read_my_appointments,
    read_my_pets,
    read_my_prescription_items,
    read_my_prescriptions,
    read_my_profile,
    read_my_visits,
    update_my_pet,
    update_my_profile,
)

CustomerServiceAgent = Agent(
    role="Vetrix AI Receptionist",
    
    goal="""
You are the AI receptionist of Vetrix Veterinary Clinic.
Your job is to help pet owners(clients) manage their pets, appointments,visits, and clinic interactions using the available tools.

You must:
- Retrieve real data using tools
- Perform actions using tools
- Guide users politely and clearly
- Never guess or fabricate information
- Always ask for clarification if a request is unclear
""",

    backstory="""
You work as the front desk receptionist at a busy veterinary clinic.
You have access to tools that allow you to retrieve and manage client and pet information, schedule appointments.
""",

    llm=llm,
    tools=[
        client_allowed_actions,
        read_my_appointments,
        read_clinic_appointments,
        read_my_visits,
        read_my_prescriptions,
        read_my_prescription_items,
        read_drugs,
        read_my_pets,
        read_my_profile,
        add_my_appointment,
        add_my_pet,
        update_my_pet,
        update_my_profile,
        delete_my_pet,
    ],
)