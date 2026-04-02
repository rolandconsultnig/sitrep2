"""
Insert mock incidents with the same count for every state + FCT (37 jurisdictions).

Default: 4 incidents per jurisdiction → 148 total (37 × 4). Adjust INCIDENTS_PER_STATE if needed.

Idempotent: removes rows whose submission_id starts with MOCK-SEED- before insert.

Usage (from backend/, with DB configured via DATABASE_URL / backend/.env):
  python seed_mock_submissions.py
"""
from __future__ import annotations

import json
import random
from datetime import datetime, timedelta

from database import SessionLocal
from models import NIGERIA_STATES, THREAT_TYPES, TREND_OPTIONS, Submission, User

MOCK_PREFIX = "MOCK-SEED-"
# Equal count per state/FCT (36 states + FCT = 37)
INCIDENTS_PER_STATE = 4


def main() -> int:
    db = SessionLocal()
    try:
        submitter = db.query(User).filter(User.username == "admin").first()
        if not submitter:
            print("ERROR: No admin user found. Run init_db.py first.")
            return 1

        deleted = (
            db.query(Submission)
            .filter(Submission.submission_id.like(f"{MOCK_PREFIX}%"))
            .delete(synchronize_session=False)
        )
        db.commit()
        if deleted:
            print(f"- Removed {deleted} existing mock submission(s)")

        n = len(NIGERIA_STATES)
        total_expected = n * INCIDENTS_PER_STATE

        random.seed(42)
        # Align with /api/reports/daily-sitrep (uses datetime.now().date() = local calendar day).
        # Most mocks fall on *today* so dashboards and 24h rollups populate; rest spread over prior days for charts.
        local_now = datetime.now()
        start_today = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
        seq = 0

        def random_report_date() -> datetime:
            if random.random() < 0.82:
                offset = random.randint(0, 86399)
                return start_today + timedelta(seconds=offset)
            day_back = random.randint(1, 12)
            day_start = start_today - timedelta(days=day_back)
            return day_start + timedelta(
                seconds=random.randint(0, 86399),
            )

        for state_idx, state in enumerate(NIGERIA_STATES):
            for _ in range(INCIDENTS_PER_STATE):
                seq += 1
                threat = THREAT_TYPES[(seq + state_idx) % len(THREAT_TYPES)]
                severity = random.choices(
                    ["Low", "Medium", "High", "Critical"],
                    weights=[32, 42, 20, 6],
                    k=1,
                )[0]
                report_date = random_report_date()
                submission_id = f"{MOCK_PREFIX}{seq:04d}"

                sub = Submission(
                    submission_id=submission_id,
                    report_date=report_date,
                    state=state,
                    lga_or_address=f"Mock LGA ({state})",
                    threat_domain=threat,
                    severity=severity,
                    trend=random.choice(TREND_OPTIONS),
                    source_reliability=random.choice(["A", "B", "B", "C"]),
                    source_credibility=random.choice(["2", "3", "3", "4"]),
                    other_agency="",
                    narrative=(
                        f"Mock incident #{seq} for {state}: {threat.lower()} — "
                        f"evenly seeded ({INCIDENTS_PER_STATE} per state/FCT)."
                    ),
                    attachments=json.dumps([]),
                    submitted_by=submitter.id,
                )
                db.add(sub)

        db.commit()
        print(
            f"+ Inserted {seq} mock submissions ({INCIDENTS_PER_STATE} per state/FCT, {n} jurisdictions, total {total_expected})."
        )
        return 0
    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
