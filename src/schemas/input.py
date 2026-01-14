from pydantic import BaseModel, Field


class BusinessInput(BaseModel):
    """What the user should give us at the beginning"""
    business_type: str = Field(..., min_length=3)
    business_stage: str = Field(..., pattern="^(idea|startup|growth|mature)$")
    location: str | None = None
    team_size: int | None = Field(None, ge=1)
    monthly_revenue_usd: float | None = None
    monthly_expenses_usd: float | None = None
    main_goal: str = Field(..., min_length=10)
    other_goals: list[str] = Field(default_factory=list)