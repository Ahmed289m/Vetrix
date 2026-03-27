from __future__ import annotations

from enum import Enum
from typing import Any
from uuid import uuid4


def generate_prefixed_id(prefix: str) -> str:
    """
    Generate deterministic Mongo business ids (stored as `_id`).
    Example: `clinic_...`, `pet_...`.
    """
    return f"{prefix}_{uuid4().hex[:12]}"


def normalize_for_mongo(value: Any) -> Any:
    """
    Convert Pydantic/Enum objects into Mongo/BSON friendly python primitives.
    """
    if isinstance(value, Enum):
        return value.value

    if isinstance(value, dict):
        return {k: normalize_for_mongo(v) for k, v in value.items()}

    if isinstance(value, list):
        return [normalize_for_mongo(v) for v in value]

    if isinstance(value, tuple):
        return tuple(normalize_for_mongo(v) for v in value)

    return value


def serialize_mongo_doc(doc: dict[str, Any] | None, id_field: str) -> dict[str, Any] | None:
    """
    Ensure `<entity>_id` exists from Mongo `_id`, then remove `_id`.
    """
    if not doc:
        return None

    mongo_id = doc.get("_id")
    if mongo_id is not None and not doc.get(id_field):
        doc[id_field] = mongo_id

    doc.pop("_id", None)
    return doc

