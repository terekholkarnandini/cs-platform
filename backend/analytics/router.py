"""
Analytics router — GET /api/analytics
Fully defensive: never returns 500. All exceptions are caught, logged,
and returned as a structured empty payload so the frontend always loads.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, Optional
from datetime import datetime, timezone, timedelta
import os
import logging
from collections import defaultdict

from chat.router import get_chat_auth_data

logger = logging.getLogger(__name__)

router = APIRouter()

DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def _empty_payload(notice: str = "", kb_docs: int = 0) -> dict:
    return {
        "kpi": {
            "total_conversations": 0,
            "ai_resolution_rate": None,
            "avg_response_time_s": None,
            "knowledge_base_documents": kb_docs,
        },
        "trend": [],
        "categories": [],
        "csat": None,
        "response_time": [],
        "heatmap": [],
        "top_complaints": [],
        "_notice": notice or None,
    }


def _weekday_label(dt: datetime) -> str:
    return DAYS_OF_WEEK[dt.weekday()]


def _get_admin_client():
    """Safely obtain the admin Supabase client. Returns None if unavailable."""
    try:
        import os as _os
        from supabase import create_client as _cc
        url = _os.getenv("VITE_SUPABASE_URL")
        # Strip any accidental whitespace (service role key has leading space in .env)
        key = (_os.getenv("SUPABASE_SERVICE_ROLE_KEY") or _os.getenv("VITE_SUPABASE_ANON_KEY") or "").strip()
        if url and key:
            return _cc(url, key)
    except Exception as e:
        logger.warning(f"[Analytics] Could not create Supabase client: {e}")
    return None


def _is_missing_table_error(e: Exception) -> bool:
    """Return True when the error indicates the conversation_history table doesn't exist.
    PostgREST raises PGRST205 with 'Could not find the table' — different from a raw
    PostgreSQL 'relation does not exist' error. Both variants are handled."""
    msg = str(e).lower()
    return any(kw in msg for kw in [
        "pgrst205",
        "could not find the table",
        "could not find",
        "does not exist",
        "42p01",
        "no such table",
    ])


def _get_kb_doc_count(company_id: str) -> int:
    try:
        import json
        data_file = os.path.join(os.path.dirname(__file__), "..", "data", "documents.json")
        if not os.path.exists(data_file):
            return 0
        with open(data_file, "r") as f:
            all_docs = json.load(f)
        return sum(1 for d in all_docs if d.get("company_id") == company_id)
    except Exception:
        return 0


@router.get("/analytics")
async def get_analytics(auth_data: Any = Depends(get_chat_auth_data)):
    """
    Compute all analytics for the authenticated company.
    Never returns 500 — all errors produce a safe empty payload with a _notice.
    """
    if auth_data.get("auth_type") != "jwt":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only session users can access analytics."
        )

    company_id: str = auth_data["company_id"]
    kb_docs = _get_kb_doc_count(company_id)

    # ── Get Supabase client ────────────────────────────────────────────────────
    sb = _get_admin_client()
    if not sb:
        logger.error("[Analytics] No Supabase client available")
        return _empty_payload(
            notice="Analytics unavailable: database connection could not be established.",
            kb_docs=kb_docs,
        )

    # ── Fetch conversations (last 30 days) ─────────────────────────────────────
    conversations: list[dict] = []
    table_exists = True
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()

    try:
        conv_res = (
            sb.table("conversation_history")
            .select("id, created_at, response_time_ms, resolved_by_ai, confidence_score, category")
            .eq("company_id", company_id)
            .gte("created_at", thirty_days_ago)
            .order("created_at", desc=False)
            .execute()
        )
        conversations = conv_res.data or []
    except Exception as e:
        logger.error(f"[Analytics] conversation_history fetch error: {type(e).__name__}: {e}")
        if _is_missing_table_error(e):
            return _empty_payload(
                notice="Run supabase-migration-analytics.sql in your Supabase SQL editor to enable analytics.",
                kb_docs=kb_docs,
            )
        return _empty_payload(
            notice=f"Could not load conversation data: {str(e)[:120]}",
            kb_docs=kb_docs,
        )

    if not table_exists:
        return _empty_payload(kb_docs=kb_docs)

    # ── All-time total conversations ───────────────────────────────────────────
    total_conversations = 0
    try:
        total_res = (
            sb.table("conversation_history")
            .select("id", count="exact")
            .eq("company_id", company_id)
            .execute()
        )
        total_conversations = total_res.count if total_res.count is not None else len(total_res.data or [])
    except Exception:
        total_conversations = len(conversations)

    # ── AI Resolution Rate ─────────────────────────────────────────────────────
    ai_resolution_rate: Optional[float] = None
    if total_conversations > 0:
        try:
            res_res = (
                sb.table("conversation_history")
                .select("id", count="exact")
                .eq("company_id", company_id)
                .eq("resolved_by_ai", True)
                .execute()
            )
            resolved_count = res_res.count if res_res.count is not None else 0
        except Exception:
            resolved_count = sum(1 for c in conversations if c.get("resolved_by_ai"))
        ai_resolution_rate = round(resolved_count / total_conversations * 100, 1)

    # ── Avg Response Time ──────────────────────────────────────────────────────
    avg_response_time_s: Optional[float] = None
    valid_times = [c["response_time_ms"] for c in conversations if c.get("response_time_ms", 0) > 0]
    if valid_times:
        avg_response_time_s = round(sum(valid_times) / len(valid_times) / 1000, 2)

    # ── 30-day trend (all days filled, even with zeros) ────────────────────────
    day_counts: dict[str, int] = defaultdict(int)
    for c in conversations:
        try:
            dt = datetime.fromisoformat(c["created_at"].replace("Z", "+00:00"))
            day_counts[dt.strftime("%b %d")] += 1
        except Exception:
            pass

    today = datetime.now(timezone.utc).date()
    trend = [
        {"d": (today - timedelta(days=i)).strftime("%b %d"),
         "Conversations": day_counts.get((today - timedelta(days=i)).strftime("%b %d"), 0)}
        for i in range(29, -1, -1)
    ]

    # ── Complaint Categories ───────────────────────────────────────────────────
    cat_counts: dict[str, int] = defaultdict(int)
    for c in conversations:
        cat_counts[c.get("category") or "Other"] += 1
    categories = [{"name": k, "value": v} for k, v in sorted(cat_counts.items(), key=lambda x: -x[1])]

    # ── AI Response Time by day-of-week ───────────────────────────────────────
    day_times: dict[str, list[float]] = defaultdict(list)
    for c in conversations:
        try:
            dt = datetime.fromisoformat(c["created_at"].replace("Z", "+00:00"))
            rt = c.get("response_time_ms", 0)
            if rt > 0:
                day_times[_weekday_label(dt)].append(rt / 1000)
        except Exception:
            pass

    response_time_chart = [
        {"d": day, **( {"AI": round(sum(day_times[day]) / len(day_times[day]), 2)} if day_times[day] else {} )}
        for day in DAYS_OF_WEEK
    ]

    # ── Activity heatmap ───────────────────────────────────────────────────────
    hm: dict[int, dict[int, int]] = defaultdict(lambda: defaultdict(int))
    for c in conversations:
        try:
            dt = datetime.fromisoformat(c["created_at"].replace("Z", "+00:00"))
            hm[dt.weekday()][dt.hour] += 1
        except Exception:
            pass

    heatmap_list = [
        {"day": di, "hour": hi, "count": hm[di][hi]}
        for di in range(7)
        for hi in range(24)
    ]

    # ── Top complaints ─────────────────────────────────────────────────────────
    top_complaints = [{"c": item["name"], "n": item["value"]} for item in categories[:10]]

    return {
        "kpi": {
            "total_conversations": total_conversations,
            "ai_resolution_rate": ai_resolution_rate,
            "avg_response_time_s": avg_response_time_s,
            "knowledge_base_documents": kb_docs,
        },
        "trend": trend,
        "categories": categories,
        "csat": None,
        "response_time": response_time_chart,
        "heatmap": heatmap_list,
        "top_complaints": top_complaints,
        "_notice": None,
    }


@router.get("/analytics/debug")
async def analytics_debug(auth_data: Any = Depends(get_chat_auth_data)):
    """Debug endpoint — reveals exact error details. Remove in production."""
    import traceback
    company_id = auth_data.get("company_id", "unknown")
    result = {"company_id": company_id, "tests": {}}

    sb = _get_admin_client()
    result["supabase_client"] = sb is not None

    if sb:
        try:
            r = sb.table("conversation_history").select("id").eq("company_id", company_id).limit(1).execute()
            result["tests"]["conversation_history_table"] = "OK"
            result["tests"]["row_count"] = len(r.data or [])
        except Exception as e:
            result["tests"]["conversation_history_table"] = f"ERROR: {traceback.format_exc()}"

    return result
