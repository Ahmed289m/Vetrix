from crewai import Crew, Process

from app.agents.agents.CSAgent import CustomerServiceAgent
from app.agents.agents.InfoAgent import InfoAgent
from app.agents.tasks.CSTask import CustomerServiceTask
from app.agents.tasks.InfoGetting import InfoGettingTask


def case_history_crew(verbose: bool = False) -> Crew:
	"""Create a simple sequential crew for make medical summarization of pet visits info to help doctor to remember it's medical history before the visit."""
	return Crew(
		agents=[InfoAgent],
		tasks=[InfoGettingTask],
		process=Process.sequential,
		verbose=verbose,
	)


def run_case_history_crew(
	case_history: dict,
	output_language: str | None = None,
	verbose: bool = False,
):
	"""Run the case history crew with a case_history input."""
	visits_info = []
	clean_case_history = case_history
	normalized_language = (output_language or "en").strip().lower()
	if normalized_language not in {"en", "ar"}:
		normalized_language = "en"
	if isinstance(case_history, dict):
		clean_case_history = {
			key: value
			for key, value in case_history.items()
			if key != "pet_type"
		}
		visits_info = clean_case_history.get("visits", []) or []
	crew = case_history_crew(verbose=verbose)
	return crew.kickoff(
		inputs={
			"case_history": clean_case_history,
			"visits_info": visits_info,
			"output_language": normalized_language,
		}
	)


def customer_service_crew(verbose: bool = False) -> Crew:
	"""Create the customer-service crew used by the client assistant route."""
	return Crew(
		agents=[CustomerServiceAgent],
		tasks=[CustomerServiceTask],
		process=Process.sequential,
		verbose=verbose,
	)


def run_customer_service_crew(
	user_prompt: str,
	client_id: str,
	clinic_id: str | None = None,
	verbose: bool = False,
):
	"""Run the customer-service crew with the client context and prompt."""
	crew = customer_service_crew(verbose=verbose)
	return crew.kickoff(
		inputs={
			"user_prompt": user_prompt,
			"client_id": client_id,
			"clinic_id": clinic_id or "",
		}
	)

