from fastapi import FastAPI, HTTPException, Depends, Cookie, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import io
import math
import secrets
import hashlib
import hmac

# PDF generation (optional - gracefully handle if not installed)
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

# Import state; graph is lazily loaded at runtime
from src.graphs.main_consultant_graph import get_graph
from src.graphs.state import AgentState, BusinessInfo
from langchain_core.messages import HumanMessage

app = FastAPI(
    title="ConsultPro AI API",
    description="Backend for AI Business Consultant SaaS",
    version="0.1.0"
)

# IMPORTANT: Allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Add your production domain later, e.g. "https://your-app.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for consultations (replace with database in production)
consultations_store: Dict[str, dict] = {}

# ---------- Visualization data helpers (for frontend charts) ----------
def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def build_visualization_data(
    business: BusinessInfo,
    target_revenue_usd: Optional[float],
    months: int = 12,
) -> Dict[str, Any]:
    """
    Build lightweight chart-ready data for the Next.js dashboard.

    The frontend expects snake_case keys:
    - revenue_projection: [{month, projected, current}]
    - cashflow_data: [{month, inflow, outflow, net}]
    - break_even_timeline: [{month, cumulative, break_even_point}]
    - market_analysis: [{segment, value}] (optional)
    """
    # Base inputs
    current_revenue = float(business.monthly_revenue or 0.0)
    monthly_expenses = float(business.monthly_expenses or 0.0)
    target = float(target_revenue_usd) if target_revenue_usd and target_revenue_usd > 0 else None

    # If target not provided, pick a reasonable target so charts aren't empty
    if target is None:
        # If current is 0, assume a small starting point; otherwise assume 50% growth goal.
        target = 25000.0 if current_revenue <= 0 else current_revenue * 1.5

    # Growth model: smooth monthly growth from current to target (capped)
    start = max(current_revenue, 1000.0) if target > 0 else max(current_revenue, 1000.0)
    # Avoid weird visuals if current is already above target
    end = max(target, start)
    # Convert to a per-month multiplier; clamp to avoid extreme growth in visuals.
    raw_growth = (end / start) ** (1.0 / max(months - 1, 1))
    growth = _clamp(raw_growth, 1.01, 1.25)

    revenue_projection = []
    cashflow_data = []
    break_even_timeline = []

    cumulative = 0.0
    for m in range(1, months + 1):
        month_label = f"M{m}"
        projected = start * (growth ** (m - 1))
        # Current line is flat at current revenue (or start fallback)
        current = current_revenue if current_revenue > 0 else start

        # Cashflow: inflow = projected revenue, outflow = expenses with light efficiency improvement
        # Assume small expense optimization over time (up to -10% by month 12)
        expense_multiplier = 1.0 - 0.10 * ((m - 1) / max(months - 1, 1))
        outflow = monthly_expenses * expense_multiplier
        inflow = projected
        net = inflow - outflow

        cumulative += net

        revenue_projection.append(
            {"month": month_label, "projected": round(projected), "current": round(current)}
        )
        cashflow_data.append(
            {"month": month_label, "inflow": round(inflow), "outflow": round(outflow), "net": round(net)}
        )
        break_even_timeline.append(
            {
                "month": month_label,
                "cumulative": round(cumulative),
                "break_even_point": 0,
            }
        )

    return {
        "revenue_projection": revenue_projection,
        "cashflow_data": cashflow_data,
        "break_even_timeline": break_even_timeline,
    }

# -------------------- Auth / users (in-memory; DB later) --------------------
users_store: Dict[str, dict] = {}
sessions_store: Dict[str, str] = {}  # session_id -> user_id


def _hash_password(password: str, salt: bytes) -> str:
    """PBKDF2-SHA256 password hash (no external deps)."""
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
    return f"pbkdf2_sha256${salt.hex()}${dk.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    try:
        algo, salt_hex, dk_hex = stored.split("$", 2)
        if algo != "pbkdf2_sha256":
            return False
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(dk_hex)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False


def _new_user_id() -> str:
    return f"u-{secrets.token_hex(8)}"


def _new_session_id() -> str:
    return secrets.token_urlsafe(32)


def get_current_user(session_id: Optional[str] = Cookie(default=None)) -> dict:
    if not session_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user_id = sessions_store.get(session_id)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    user = users_store.get(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


class AuthSignup(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    timezone: Optional[str] = None


class AuthLogin(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    message: str


@app.post("/api/auth/signup", response_model=AuthResponse)
async def signup(data: AuthSignup):
    email = data.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email is required")
    if not data.password or len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    if any(u.get("email", "").lower() == email for u in users_store.values()):
        raise HTTPException(status_code=409, detail="Email already registered")

    user_id = _new_user_id()
    salt = secrets.token_bytes(16)
    now = datetime.utcnow().isoformat() + "Z"
    users_store[user_id] = {
        "id": user_id,
        "email": email,
        "name": (data.name or "").strip() or email.split("@")[0],
        "image": None,
        "subscription": "free",
        "consultations_used": 0,
        "consultations_limit": 1,
        "created_at": now,
        "timezone": data.timezone or "UTC",
        "password_hash": _hash_password(data.password, salt),
        "notification_preferences": {
            "email_notifications": True,
            "marketing_emails": False,
            "consultation_updates": True,
            "weekly_digest": True,
        },
    }
    return {"message": "Account created"}


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(data: AuthLogin):
    email = data.email.strip().lower()
    user = next((u for u in users_store.values() if u.get("email", "").lower() == email), None)
    if not user or not _verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session_id = _new_session_id()
    sessions_store[session_id] = user["id"]

    response = JSONResponse({"message": "Logged in"})
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        samesite="lax",
        secure=False,  # set True behind HTTPS in production
        max_age=60 * 60 * 24 * 7,  # 7 days
        path="/",
    )
    return response


@app.post("/api/auth/logout", response_model=AuthResponse)
async def logout(session_id: Optional[str] = Cookie(default=None)):
    if session_id and session_id in sessions_store:
        del sessions_store[session_id]
    response = JSONResponse({"message": "Logged out"})
    response.delete_cookie("session_id", path="/")
    return response


class ConsultationCreate(BaseModel):
    business_name: Optional[str] = None
    business_type: str
    business_stage: str
    industry: Optional[str] = None
    location: Optional[str] = None
    team_size: Optional[int] = None
    monthly_revenue_usd: Optional[float] = None
    monthly_expenses_usd: Optional[float] = None
    main_goal: str
    other_goals: List[str] = []
    target_revenue_usd: Optional[float] = None
    plan: str = "basic"  # basic / premium / ultra


def _subscription_to_consultation_plan(subscription: str) -> str:
    """
    Consultation depth is derived from subscription; client input is ignored.
    """
    s = (subscription or "free").lower().strip()
    if s == "enterprise":
        return "ultra"
    if s == "pro":
        return "premium"
    # free + starter default to basic
    return "basic"


class FeedbackCreate(BaseModel):
    rating: int  # 1-5
    comment: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    timezone: Optional[str] = None


class NotificationPreferences(BaseModel):
    email_notifications: bool = True
    marketing_emails: bool = False
    consultation_updates: bool = True
    weekly_digest: bool = True


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@app.post("/api/consultations")
async def create_consultation(data: ConsultationCreate, user: dict = Depends(get_current_user)):
    try:
        # Enforce plan from subscription (do not allow client-selected plan)
        effective_plan = _subscription_to_consultation_plan(user.get("subscription", "free"))

        # Validate required fields
        if not data.business_type or not data.business_type.strip():
            raise HTTPException(status_code=400, detail="business_type is required")
        if not data.business_stage or not data.business_stage.strip():
            raise HTTPException(status_code=400, detail="business_stage is required")
        if not data.main_goal or not data.main_goal.strip():
            raise HTTPException(status_code=400, detail="main_goal is required")
        
        # Map to internal BusinessInfo model (required fields only)
        business = BusinessInfo(
            business_type=data.business_type.strip(),
            business_stage=data.business_stage.strip(),
            location=data.location.strip() if data.location else None,
            team_size=data.team_size,
            monthly_revenue=data.monthly_revenue_usd,
            monthly_expenses=data.monthly_expenses_usd,
            main_goal=data.main_goal.strip(),
            other_goals=[g.strip() for g in data.other_goals if g and g.strip()] if data.other_goals else []
        )

        # Build extra context from additional fields
        extra_context_parts = []
        if data.business_name and data.business_name.strip():
            extra_context_parts.append(f"Business name: {data.business_name.strip()}")
        if data.industry and data.industry.strip():
            extra_context_parts.append(f"Industry: {data.industry.strip()}")
        if data.target_revenue_usd and data.target_revenue_usd > 0:
            extra_context_parts.append(f"Target monthly revenue: ${data.target_revenue_usd:,.2f}")

        extra_context = "\n".join(extra_context_parts)

        initial_prompt = f"Help me with: {data.main_goal.strip()}"
        if extra_context:
            initial_prompt += f"\nAdditional context:\n{extra_context}"

        initial_state = AgentState(
            business=business,
            messages=[HumanMessage(content=initial_prompt)],
            needs_refinement=True,
            max_refinement_rounds=3 if effective_plan in ["premium", "ultra"] else 1,
            current_refinement_round=0
        )

        config = {"configurable": {"thread_id": f"consult_{datetime.utcnow().timestamp()}"}}

        final_state = None
        refined_strategy = ""
        visualization_code = ""
        start_time = datetime.utcnow()

        # Run full workflow (lazy graph init)
        graph = get_graph()
        for event in graph.stream(initial_state, config, stream_mode="values"):
            final_state = event
            if final_state.get("refined_strategy"):
                refined_strategy = final_state["refined_strategy"]
            if final_state.get("visualization_code"):
                visualization_code = final_state["visualization_code"]
        
        # Calculate processing time
        processing_time = int((datetime.utcnow() - start_time).total_seconds())

        if not final_state:
            raise HTTPException(status_code=500, detail="Processing failed - no result")

        # Generate simple ID (replace with real DB later)
        consultation_id = f"c-{int(datetime.utcnow().timestamp())}-{hash(data.main_goal) % 10000:04x}"
        now = datetime.utcnow()
        created_at = now.isoformat() + "Z"

        consultation_data = {
            "id": consultation_id,
            "user_id": user["id"],
            "status": "completed",
            "created_at": created_at,
            "updated_at": created_at,
            "business": business.model_dump(),
            "plan_used": effective_plan,
            "refined_strategy": refined_strategy or "No strategy was generated.",
            "visualization_code": visualization_code,
            "visualization_data": build_visualization_data(
                business=business,
                target_revenue_usd=data.target_revenue_usd,
                months=12,
            ),
            "refinement_count": final_state.get("current_refinement_round", 0),
            "business_name": data.business_name.strip() if data.business_name else None,
            "industry": data.industry.strip() if data.industry else None,
            "target_revenue_usd": data.target_revenue_usd,
            "processing_time": processing_time,
            "model_used": "GPT-4o",  # Default model name
            "feedback": None,
        }

        # Store in memory
        consultations_store[consultation_id] = consultation_data
        # Update user usage stats
        user["consultations_used"] = int(user.get("consultations_used", 0)) + 1
        users_store[user["id"]] = user

        return consultation_data

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the full error for debugging
        import traceback
        error_detail = str(e)
        # In production, log to proper logging system
        print(f"Error creating consultation: {error_detail}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Server error: {error_detail}")


@app.get("/api/consultations")
async def list_consultations(user: dict = Depends(get_current_user)):
    """List all consultations"""
    # Return in reverse chronological order (newest first)
    consultations = [c for c in consultations_store.values() if c.get("user_id") == user["id"]]
    consultations.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return consultations


@app.get("/api/consultations/{consultation_id}")
async def get_consultation(consultation_id: str, user: dict = Depends(get_current_user)):
    """Get a single consultation by ID"""
    consultation = consultations_store.get(consultation_id)
    if not consultation or consultation.get("user_id") != user["id"]:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return consultation


@app.post("/api/consultations/{consultation_id}/feedback")
async def submit_feedback(consultation_id: str, feedback: FeedbackCreate, user: dict = Depends(get_current_user)):
    """Submit feedback for a consultation"""
    if feedback.rating < 1 or feedback.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    consultation = consultations_store.get(consultation_id)
    if not consultation or consultation.get("user_id") != user["id"]:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    # Update consultation with feedback
    consultation["feedback"] = {
        "rating": feedback.rating,
        "comment": feedback.comment,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    consultation["updated_at"] = datetime.utcnow().isoformat() + "Z"
    
    consultations_store[consultation_id] = consultation
    
    return {"message": "Feedback submitted successfully"}


class ConsultationUpdate(BaseModel):
    business_name: Optional[str] = None
    industry: Optional[str] = None
    target_revenue_usd: Optional[float] = None


@app.patch("/api/consultations/{consultation_id}")
async def update_consultation(consultation_id: str, data: ConsultationUpdate, user: dict = Depends(get_current_user)):
    """Update a consultation (partial update)"""
    consultation = consultations_store.get(consultation_id)
    if not consultation or consultation.get("user_id") != user["id"]:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    # Update fields if provided
    if data.business_name is not None:
        consultation["business_name"] = data.business_name.strip() if data.business_name else None
    if data.industry is not None:
        consultation["industry"] = data.industry.strip() if data.industry else None
    if data.target_revenue_usd is not None:
        consultation["target_revenue_usd"] = data.target_revenue_usd
    
    consultation["updated_at"] = datetime.utcnow().isoformat() + "Z"
    consultations_store[consultation_id] = consultation
    
    return consultation


@app.delete("/api/consultations/{consultation_id}")
async def delete_consultation(consultation_id: str, user: dict = Depends(get_current_user)):
    """Delete a consultation"""
    consultation = consultations_store.get(consultation_id)
    if not consultation or consultation.get("user_id") != user["id"]:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    del consultations_store[consultation_id]
    return {"message": "Consultation deleted successfully"}


@app.get("/api/user")
async def get_user(user: dict = Depends(get_current_user)):
    """Get current user"""
    # Never return password hash
    safe = {k: v for k, v in user.items() if k != "password_hash"}
    return safe


@app.put("/api/user")
async def update_user(data: UserUpdate, user: dict = Depends(get_current_user)):
    """Update user profile"""
    if data.name is not None:
        user["name"] = data.name.strip()
    if data.email is not None:
        email = data.email.strip().lower()
        if not email or "@" not in email:
            raise HTTPException(status_code=400, detail="Valid email is required")
        # prevent taking someone else's email
        if any(u["id"] != user["id"] and u.get("email", "").lower() == email for u in users_store.values()):
            raise HTTPException(status_code=409, detail="Email already in use")
        user["email"] = email
    if data.timezone is not None:
        user["timezone"] = data.timezone

    users_store[user["id"]] = user
    safe = {k: v for k, v in user.items() if k != "password_hash"}
    return safe


@app.put("/api/user/notifications")
async def update_notifications(prefs: NotificationPreferences, user: dict = Depends(get_current_user)):
    """Update notification preferences"""
    user["notification_preferences"] = prefs.model_dump()
    users_store[user["id"]] = user
    return {"message": "Notification preferences updated", "preferences": prefs.model_dump()}


@app.put("/api/user/password")
async def change_password(data: PasswordChange, user: dict = Depends(get_current_user)):
    """Change user password"""
    if not _verify_password(data.current_password, user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if not data.new_password or len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    salt = secrets.token_bytes(16)
    user["password_hash"] = _hash_password(data.new_password, salt)
    users_store[user["id"]] = user
    return {"message": "Password updated successfully"}


class PlanUpgrade(BaseModel):
    plan: str


@app.post("/api/billing/upgrade")
async def upgrade_plan(data: PlanUpgrade, user: dict = Depends(get_current_user)):
    """Upgrade user subscription plan"""
    plan = data.plan
    valid_plans = ["free", "starter", "pro", "enterprise"]
    if plan not in valid_plans:
        raise HTTPException(status_code=400, detail=f"Invalid plan. Must be one of: {valid_plans}")
    
    # Update subscription and limits
    user["subscription"] = plan
    if plan == "enterprise":
        user["consultations_limit"] = -1
    elif plan == "pro":
        user["consultations_limit"] = 10
    elif plan == "starter":
        user["consultations_limit"] = 3
    else:
        user["consultations_limit"] = 1
    
    user["consultations_used"] = 0  # Reset on upgrade
    users_store[user["id"]] = user
    
    return {"message": f"Successfully upgraded to {plan} plan", "user": user}


@app.get("/api/billing/plans")
async def get_billing_plans():
    """
    Subscription plan catalog used by frontend billing + sidebar + dashboard.
    This is product configuration (not user mock data).
    """
    return {
        "plans": [
            {
                "id": "free",
                "name": "Free",
                "price_monthly_usd": 0,
                "consultations_per_month": 1,
                "max_refinements": 0,
                "features": ["Basic analysis", "Standard processing", "Email support"],
            },
            {
                "id": "starter",
                "name": "Starter",
                "price_monthly_usd": 29,
                "consultations_per_month": 3,
                "max_refinements": 1,
                "features": ["Enhanced analysis", "Priority processing", "Chat support", "Basic visualizations"],
            },
            {
                "id": "pro",
                "name": "Pro",
                "price_monthly_usd": 79,
                "consultations_per_month": 10,
                "max_refinements": 3,
                "features": [
                    "Advanced analysis",
                    "Priority processing",
                    "24/7 support",
                    "Advanced visualizations",
                    "Export to PDF",
                    "Custom reports",
                ],
                "badge": "Most Popular",
            },
            {
                "id": "enterprise",
                "name": "Enterprise",
                "price_monthly_usd": 299,
                "consultations_per_month": -1,
                "max_refinements": -1,
                "features": [
                    "Full analysis suite",
                    "Instant processing",
                    "Dedicated support",
                    "All visualizations",
                    "White-label reports",
                    "API access",
                    "Team collaboration",
                    "Custom integrations",
                ],
            },
        ],
        "feature_matrix": [
            {"key": "consultations_per_month", "label": "Consultations/month"},
            {"key": "max_refinements", "label": "Max refinement rounds"},
            {"key": "advanced_visualizations", "label": "Advanced visualizations"},
            {"key": "priority_processing", "label": "Priority processing"},
            {"key": "export_pdf", "label": "Export to PDF"},
            {"key": "custom_reports", "label": "Custom reports"},
            {"key": "api_access", "label": "API access"},
        ],
        "feature_matrix_values": {
            "free": {
                "advanced_visualizations": False,
                "priority_processing": False,
                "export_pdf": False,
                "custom_reports": False,
                "api_access": False,
            },
            "starter": {
                "advanced_visualizations": True,
                "priority_processing": True,
                "export_pdf": False,
                "custom_reports": False,
                "api_access": False,
            },
            "pro": {
                "advanced_visualizations": True,
                "priority_processing": True,
                "export_pdf": True,
                "custom_reports": True,
                "api_access": False,
            },
            "enterprise": {
                "advanced_visualizations": True,
                "priority_processing": True,
                "export_pdf": True,
                "custom_reports": True,
                "api_access": True,
            },
        },
    }


# -------------------- Meta endpoints (remove hardcoded UI datasets) --------------------
@app.get("/api/meta/industries")
async def get_industries():
    return {
        "industries": [
            "Software & Technology",
            "Healthcare",
            "Finance & Fintech",
            "E-Commerce & Retail",
            "Education & EdTech",
            "Media & Entertainment",
            "Food & Beverage",
            "Manufacturing",
            "Real Estate",
            "Professional Services",
            "Other",
        ]
    }


@app.get("/api/meta/business-stages")
async def get_business_stages():
    return {
        "stages": [
            {"value": "idea", "label": "Idea Stage"},
            {"value": "startup", "label": "Startup"},
            {"value": "growth", "label": "Growth"},
            {"value": "mature", "label": "Mature"},
            {"value": "established", "label": "Established"},
            {"value": "enterprise", "label": "Enterprise"},
        ]
    }


@app.get("/api/meta/suggested-goals")
async def get_suggested_goals():
    return {
        "goals": [
            "Scale revenue",
            "Improve profitability",
            "Reduce costs",
            "Expand market share",
            "Launch new product",
            "Enter new market",
            "Increase retention",
            "Build team",
        ]
    }


@app.get("/api/meta/consultation-plans")
async def get_consultation_plans():
    # These map to ConsultationCreate.plan (basic/premium/ultra)
    return {
        "plans": [
            {
                "id": "basic",
                "name": "Basic",
                "price_usd": 0,
                "description": "Quick strategic overview",
                "features": ["Basic SWOT analysis", "Key recommendations", "Standard processing", "1 refinement"],
                "popular": False,
            },
            {
                "id": "premium",
                "name": "Premium",
                "price_usd": 29,
                "description": "Comprehensive analysis",
                "features": [
                    "In-depth market analysis",
                    "Financial projections",
                    "Competitive landscape",
                    "Priority processing",
                    "3 refinements",
                    "Interactive visualizations",
                ],
                "popular": True,
            },
            {
                "id": "ultra",
                "name": "Ultra",
                "price_usd": 99,
                "description": "Enterprise-grade insights",
                "features": [
                    "Everything in Premium",
                    "Custom industry benchmarks",
                    "Risk assessment matrix",
                    "Implementation roadmap",
                    "Unlimited refinements",
                    "Export to PDF",
                    "30-min follow-up call",
                ],
                "popular": False,
            },
        ]
    }


@app.get("/api/meta/timezones")
async def get_timezones():
    return {
        "timezones": [
            {"value": "America/Los_Angeles", "label": "Pacific Time (PT)"},
            {"value": "America/Denver", "label": "Mountain Time (MT)"},
            {"value": "America/Chicago", "label": "Central Time (CT)"},
            {"value": "America/New_York", "label": "Eastern Time (ET)"},
            {"value": "Europe/London", "label": "GMT (London)"},
            {"value": "Europe/Paris", "label": "CET (Paris)"},
            {"value": "Asia/Tokyo", "label": "JST (Tokyo)"},
            {"value": "UTC", "label": "UTC"},
        ]
    }


# -------------------- Notifications (backed by real endpoints) --------------------
notifications_store: Dict[str, List[dict]] = {}  # user_id -> list[{id, type, title, body, created_at, read_at?}]


@app.get("/api/notifications/unread-count")
async def unread_count(user: dict = Depends(get_current_user)):
    items = notifications_store.get(user["id"], [])
    unread = sum(1 for n in items if not n.get("read_at"))
    return {"unread": unread}


@app.get("/api/notifications")
async def list_notifications(user: dict = Depends(get_current_user)):
    items = notifications_store.get(user["id"], [])
    items_sorted = sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)
    return {"notifications": items_sorted}


@app.post("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    items = notifications_store.get(user["id"], [])
    for n in items:
        if n.get("id") == notification_id:
            if not n.get("read_at"):
                n["read_at"] = datetime.utcnow().isoformat() + "Z"
            return {"message": "Marked as read"}
    raise HTTPException(status_code=404, detail="Notification not found")


@app.get("/api/consultations/{consultation_id}/export/pdf")
async def export_consultation_pdf(consultation_id: str, user: dict = Depends(get_current_user)):
    """Export consultation as PDF"""
    if not REPORTLAB_AVAILABLE:
        raise HTTPException(status_code=503, detail="PDF generation not available. Please install reportlab.")
    
    consultation = consultations_store.get(consultation_id)
    if not consultation or consultation.get("user_id") != user["id"]:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    try:
        # Create PDF in memory
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor='#1a1a1a',
            spaceAfter=30,
            alignment=TA_CENTER
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor='#2563eb',
            spaceAfter=12,
            spaceBefore=20
        )
        
        # Title
        business_name = consultation.get("business_name") or "Business Consultation"
        story.append(Paragraph(f"Consultation Report: {business_name}", title_style))
        story.append(Spacer(1, 0.3*inch))
        
        # Business Information
        story.append(Paragraph("Business Information", heading_style))
        business = consultation.get("business", {})
        story.append(Paragraph(f"<b>Type:</b> {business.get('business_type', 'N/A')}", styles['Normal']))
        story.append(Paragraph(f"<b>Stage:</b> {business.get('business_stage', 'N/A')}", styles['Normal']))
        if business.get('location'):
            story.append(Paragraph(f"<b>Location:</b> {business.get('location')}", styles['Normal']))
        if business.get('team_size'):
            story.append(Paragraph(f"<b>Team Size:</b> {business.get('team_size')}", styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        
        # Financial Information
        story.append(Paragraph("Financial Overview", heading_style))
        if business.get('monthly_revenue'):
            story.append(Paragraph(f"<b>Monthly Revenue:</b> ${business.get('monthly_revenue'):,.2f}", styles['Normal']))
        if business.get('monthly_expenses'):
            story.append(Paragraph(f"<b>Monthly Expenses:</b> ${business.get('monthly_expenses'):,.2f}", styles['Normal']))
        story.append(Paragraph(f"<b>Main Goal:</b> {business.get('main_goal', 'N/A')}", styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        
        # Strategy
        story.append(PageBreak())
        story.append(Paragraph("Strategic Recommendations", heading_style))
        strategy = consultation.get("refined_strategy", "No strategy available.")
        # Clean markdown and split into paragraphs
        strategy_paragraphs = strategy.split('\n\n')
        for para in strategy_paragraphs[:20]:  # Limit to first 20 paragraphs
            if para.strip():
                # Remove markdown headers
                para = para.replace('#', '').replace('##', '').replace('###', '').strip()
                if para:
                    story.append(Paragraph(para, styles['Normal']))
                    story.append(Spacer(1, 0.1*inch))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        return Response(
            content=buffer.getvalue(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=consultation-{consultation_id}.pdf"
            }
        )
    except Exception as e:
        # Fallback: return text if PDF generation fails
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")