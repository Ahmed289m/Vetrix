"""
One-time migration script: Normalize interactions to use drug_id references.

This script scans all drugs in MongoDB and converts any name-based entries
in the `interactions` array to their corresponding `drug_id` values.

Usage:
    python -m app.scripts.migrate_drug_interactions

    Or from the backend directory:
    python scripts/migrate_drug_interactions.py
"""

import asyncio
import logging
import re
import sys
from pathlib import Path

# Ensure the backend root is on sys.path so we can import app modules
backend_root = Path(__file__).resolve().parents[1]
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.core.config import settings
from motor.motor_asyncio import AsyncIOMotorClient

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
logger = logging.getLogger("migrate_drug_interactions")

# Pattern that matches a typical drug_id (UUID or similar)
_ID_PATTERN = re.compile(r"^[0-9a-fA-F-]{20,}$")


def _looks_like_id(value: str) -> bool:
    """Return True if the value looks like a drug_id rather than a drug name."""
    return bool(_ID_PATTERN.match(value))


async def migrate():
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]
    collection = db["drugs"]

    # Build a name → drug_id lookup (case-insensitive)
    all_drugs = await collection.find({}).to_list(length=None)
    name_to_id: dict[str, str] = {}
    for drug in all_drugs:
        drug_id = drug.get("drug_id") or str(drug.get("_id", ""))
        name = (drug.get("name") or "").strip()
        if name and drug_id:
            name_to_id[name.lower()] = drug_id

    logger.info("Found %d drugs in database", len(all_drugs))
    logger.info("Built name→id lookup with %d entries", len(name_to_id))

    updated_count = 0
    skipped_count = 0
    unresolved_entries: list[tuple[str, str]] = []  # (drug_name, unresolved_entry)

    for drug in all_drugs:
        drug_id = drug.get("drug_id") or str(drug.get("_id", ""))
        drug_name = drug.get("name", "???")
        interactions: list = drug.get("interactions", [])

        if not interactions:
            continue

        new_interactions: list[str] = []
        changed = False

        for entry in interactions:
            entry_str = str(entry).strip()
            if not entry_str:
                continue

            if _looks_like_id(entry_str):
                # Already an ID — keep as-is
                new_interactions.append(entry_str)
            else:
                # Try to resolve name → ID
                resolved_id = name_to_id.get(entry_str.lower())
                if resolved_id:
                    new_interactions.append(resolved_id)
                    changed = True
                    logger.info(
                        "  [%s] Resolved '%s' → '%s'",
                        drug_name, entry_str, resolved_id,
                    )
                else:
                    # Keep the original but flag it
                    new_interactions.append(entry_str)
                    unresolved_entries.append((drug_name, entry_str))
                    logger.warning(
                        "  [%s] Could not resolve '%s' — no matching drug found",
                        drug_name, entry_str,
                    )

        if changed:
            await collection.update_one(
                {"drug_id": drug_id},
                {"$set": {"interactions": new_interactions}},
            )
            updated_count += 1
            logger.info("  Updated %s (%s)", drug_name, drug_id)
        else:
            skipped_count += 1

    # Summary
    logger.info("")
    logger.info("=" * 60)
    logger.info("Migration complete!")
    logger.info("  Updated: %d drugs", updated_count)
    logger.info("  Skipped (already IDs or empty): %d drugs", skipped_count)
    if unresolved_entries:
        logger.warning("  Unresolved entries (%d):", len(unresolved_entries))
        for drug_name, entry in unresolved_entries:
            logger.warning("    - [%s] '%s'", drug_name, entry)
    else:
        logger.info("  All entries resolved successfully!")
    logger.info("=" * 60)

    client.close()


if __name__ == "__main__":
    asyncio.run(migrate())
