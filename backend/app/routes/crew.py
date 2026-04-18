from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/agent", tags=["agent"])


@router.get("/crew/{pet_id}")
def run_crew(pet_id: str) -> dict:
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

    result = run_case_history_crew(pet_id)
    payload = result.model_dump() if hasattr(result, "model_dump") else result
    return {
        "success": True,
        "message": "Case history generated successfully.",
        "data": payload,
    }