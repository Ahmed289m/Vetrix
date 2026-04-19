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


def run_case_history_crew(case_history: dict, verbose: bool = False):
	"""Run the case history crew with a case_history input."""
	visits_info = []
	if isinstance(case_history, dict):
		visits_info = case_history.get("visits", []) or []
	crew = case_history_crew(verbose=verbose)
	return crew.kickoff(inputs={"case_history": case_history, "visits_info": visits_info})

