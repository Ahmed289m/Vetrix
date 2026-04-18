import logging
import json
from typing import Any

from fastapi import APIRouter, HTTPException, status

from app.core.config import settings

router = APIRouter(prefix="/agent", tags=["agent"])
logger = logging.getLogger(__name__)


def _parse_visits_candidate(value: Any) -> list[dict[str, str]] | None:
    if not isinstance(value, list):
        return None

    visits: list[dict[str, str]] = []
    for item in value:
        if not isinstance(item, dict):
            continue
        visits.append(
            {
                "notes": str(item.get("notes") or ""),
                "medications": str(item.get("medications") or ""),
                "date": str(item.get("date") or ""),
            }
        )
    return visits


def _extract_visits(payload: Any) -> list[dict[str, str]]:
    # Direct shapes first.
    direct = _parse_visits_candidate(payload)
    if direct is not None:
        return direct

    if isinstance(payload, dict):
        direct = _parse_visits_candidate(payload.get("visits"))
        if direct is not None:
            return direct

        pydantic_obj = payload.get("pydantic")
        if isinstance(pydantic_obj, dict):
            direct = _parse_visits_candidate(pydantic_obj.get("visits"))
            if direct is not None:
                return direct

        json_dict = payload.get("json_dict")
        if isinstance(json_dict, dict):
            direct = _parse_visits_candidate(json_dict.get("visits"))
            if direct is not None:
                return direct

        raw = payload.get("raw")
        if isinstance(raw, str):
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, dict):
                    direct = _parse_visits_candidate(parsed.get("visits"))
                else:
                    direct = _parse_visits_candidate(parsed)
                if direct is not None:
                    return direct
            except json.JSONDecodeError:
                logger.warning("Crew raw output is not valid JSON")

        tasks_output = payload.get("tasks_output")
        if isinstance(tasks_output, list):
            for task in tasks_output:
                if not isinstance(task, dict):
                    continue
                task_json_dict = task.get("json_dict")
                if isinstance(task_json_dict, dict):
                    direct = _parse_visits_candidate(task_json_dict.get("visits"))
                    if direct is not None:
                        return direct

                task_raw = task.get("raw")
                if isinstance(task_raw, str):
                    try:
                        parsed = json.loads(task_raw)
                        if isinstance(parsed, dict):
                            direct = _parse_visits_candidate(parsed.get("visits"))
                        else:
                            direct = _parse_visits_candidate(parsed)
                        if direct is not None:
                            return direct
                    except json.JSONDecodeError:
                        continue

    if isinstance(payload, str):
        try:
            parsed = json.loads(payload)
            if isinstance(parsed, dict):
                direct = _parse_visits_candidate(parsed.get("visits"))
            else:
                direct = _parse_visits_candidate(parsed)
            if direct is not None:
                return direct
        except json.JSONDecodeError:
            logger.warning("Crew payload string is not valid JSON")

    return []


@router.get("/crew/{pet_id}")
def run_crew(pet_id: str) -> dict:
    normalized_pet_id = (pet_id or "").strip()
    if not normalized_pet_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="pet_id is required.",
        )

    if not (settings.groq_api_key or "").strip():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Case history service is unavailable because GROQ_API_KEY is missing at runtime.",
        )

    try:
        # Lazy import so missing optional AI deps do not break app startup.
        from app.agents.crew import run_case_history_crew
    except ModuleNotFoundError as exc:
        missing = exc.name or "required AI dependency"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                f"Case history service is unavailable because '{missing}' is not installed. "
                "Install backend AI dependencies and restart the service."
            ),
        ) from exc
    except Exception as exc:
        logger.exception("Crew import/configuration failed for pet_id=%s", normalized_pet_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Case history service is unavailable due to AI configuration error: "
                f"{exc.__class__.__name__}."
            ),
        ) from exc

    try:
        result = run_case_history_crew(normalized_pet_id)
        if hasattr(result, "model_dump"):
            payload = result.model_dump()
        elif isinstance(result, (dict, list, str, int, float, bool)) or result is None:
            payload = result
        else:
            payload = str(result)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Crew execution failed for pet_id=%s", normalized_pet_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Case history generation failed. Please verify AI provider settings and try again. "
                f"Error type: {exc.__class__.__name__}."
            ),
        ) from exc

    visits = _extract_visits(payload)

    return {
        "success": True,
        "message": "Case history generated successfully.",
        "data": {"visits": visits},
    }
