from crewai import Crew, Process

from app.agents.agents.InfoAgent import InfoAgent
from app.agents.tasks.InfoGetting import InfoGettingTask


def case_history_crew(verbose: bool = False) -> Crew:
	"""Create a simple sequential crew for make medical summarization of pet visits info to help doctor to remember it's medical history before the visit."""
	return Crew(
		agents=[InfoAgent],
		tasks=[InfoGettingTask],
		process=Process.sequential,
		verbose=verbose,
	)


def run_case_history_crew(pet_id: str, verbose: bool = False):
	"""Run the case history crew with a pet_id input."""
	crew = case_history_crew(verbose=verbose)
	return crew.kickoff(inputs={"pet_id": pet_id})

