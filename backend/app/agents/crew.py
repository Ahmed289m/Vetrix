from crewai import Crew, Process
import re

from app.agents.agents.AppointmentAgent import AppointmentAgent
from app.agents.agents.InfoAgent import InfoAgent
from app.agents.agents.MedicalAgent import MedicalAgent
from app.agents.agents.PetAgent import PetAgent
from app.agents.agents.RouterAgent import RouterAgent
from app.agents.tasks.AppointmentTask import AppointmentTask
from app.agents.tasks.InfoGetting import InfoGettingTask
from app.agents.tasks.MedicalTask import MedicalTask
from app.agents.tasks.PetTask import PetTask
from app.agents.tasks.RouterTask import RouterTask


# ── Case-History Crew (unchanged) ────────────────────────────────────────────

def case_history_crew(verbose: bool = False) -> Crew:
	"""Create a simple sequential crew for medical summarization of pet visits."""
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


# ── Multi-Agent Customer Service Crew ────────────────────────────────────────

# Maps each intent keyword to the (Agent, Task) specialist pair.
_SPECIALIST_MAP = {
	"pets": (PetAgent, PetTask),
	"appointments": (AppointmentAgent, AppointmentTask),
	"medical": (MedicalAgent, MedicalTask),
}

# Fallback reply used when intent is "general" (no LLM call needed).
_GENERAL_REPLY = (
	"Hello! I'm the Vetrix AI assistant.I can help you?"
	
)


class _SimpleOutput:
	"""Lightweight stand-in for CrewOutput used in the general fallback path."""

	def __init__(self, text: str) -> None:
		self.raw = text

	def __str__(self) -> str:
		return self.raw


def _parse_intent(router_output: str) -> str:
	"""Extract the intent keyword from the RouterAgent output."""
	raw = (router_output or "").strip().lower()
	valid = set(_SPECIALIST_MAP.keys()) | {"general"}

	# Expected path: a single category token only.
	if raw in valid:
		return raw

	# Accept common noisy variants like: "Final Output: appointments".
	for line in raw.splitlines():
		clean = re.sub(r"[^a-z]", "", line)
		if clean in valid:
			return clean
		match = re.search(r"final\s*output\s*:\s*(pets|appointments|medical|general)", line)
		if match:
			return match.group(1)

	return "general"


def run_customer_service_crew(
	user_prompt: str,
	client_id: str,
	clinic_id: str | None = None,
	verbose: bool = False,
):
	"""
	Run the multi-agent customer service system.

	Flow:
	  1. RouterAgent classifies the intent  (no tools → very cheap, ~0 extra token schemas).
	  2. The matching specialist agent handles the request (only 2–4 tool schemas loaded).

	The public signature is identical to the original single-agent version,
	so no changes are required in the route handler.
	"""
	from app.agents.tools.CSTools import set_context

	set_context(client_id, clinic_id or "")

	inputs = {
		"user_prompt": user_prompt,
		"client_id": client_id,
		"clinic_id": clinic_id or "",
	}

	# ── Step 1: Route ────────────────────────────────────────────────────────
	router_crew = Crew(
		agents=[RouterAgent],
		tasks=[RouterTask],
		process=Process.sequential,
		verbose=verbose,
	)
	router_result = router_crew.kickoff(inputs=inputs)
	intent = _parse_intent(str(router_result))

	# ── Step 2: Specialist ───────────────────────────────────────────────────
	if intent not in _SPECIALIST_MAP:
		# General / unknown intent — return a friendly message without an extra LLM call.
		return _SimpleOutput(_GENERAL_REPLY)

	agent, task = _SPECIALIST_MAP[intent]
	specialist_crew = Crew(
		agents=[agent],
		tasks=[task],
		process=Process.sequential,
		verbose=verbose,
	)
	return specialist_crew.kickoff(inputs=inputs)
