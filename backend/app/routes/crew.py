from fastapi import APIRouter

from app.agents.crew import run_case_history_crew

router = APIRouter(prefix="/agent", tags=["agent"])


@router.get("/crew/{pet_id}")
def run_crew(pet_id: str) -> dict:
    result = run_case_history_crew(pet_id)
    payload = result.model_dump() if hasattr(result, "model_dump") else result
    return {
        "success": True,
        "message": "Case history generated successfully.",
        "data": payload,
    }