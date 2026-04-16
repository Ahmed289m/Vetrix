"""
Mongo migration for normalized prescription structures.

This script removes legacy prescription and prescription-item documents that
still use old singular/comma-separated fields, then keeps only normalized docs:
- prescriptions.prescriptionItem_ids: list[str]
- prescription_items.drug_ids: list[str]

Run:
  python -m app.scripts.migrate_prescriptions_to_multi_items
"""

from __future__ import annotations

import asyncio

from app.core.database import close_mongo_connection, connect_to_mongo, get_database


async def run_migration() -> None:
    await connect_to_mongo()
    db = get_database()

    prescriptions = db["prescriptions"]
    prescription_items = db["prescription_items"]

    # Remove all legacy prescriptions that still use singular field.
    legacy_rx_result = await prescriptions.delete_many({"prescriptionItem_id": {"$exists": True}})

    # Remove malformed prescriptions missing normalized field.
    malformed_rx_result = await prescriptions.delete_many(
        {
            "$or": [
                {"prescriptionItem_ids": {"$exists": False}},
                {"prescriptionItem_ids": None},
                {"prescriptionItem_ids": {"$not": {"$type": "array"}}},
                {"prescriptionItem_ids": {"$size": 0}},
            ]
        }
    )

    # Remove legacy items using singular drug_id.
    legacy_item_result = await prescription_items.delete_many({"drug_id": {"$exists": True}})

    # Remove malformed items missing normalized field.
    malformed_item_result = await prescription_items.delete_many(
        {
            "$or": [
                {"drug_ids": {"$exists": False}},
                {"drug_ids": None},
                {"drug_ids": {"$not": {"$type": "array"}}},
                {"drug_ids": {"$size": 0}},
            ]
        }
    )

    print("Prescription migration completed")
    print(f"Deleted legacy prescriptions: {legacy_rx_result.deleted_count}")
    print(f"Deleted malformed prescriptions: {malformed_rx_result.deleted_count}")
    print(f"Deleted legacy prescription items: {legacy_item_result.deleted_count}")
    print(f"Deleted malformed prescription items: {malformed_item_result.deleted_count}")

    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(run_migration())
