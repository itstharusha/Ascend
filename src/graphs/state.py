from typing import Annotated, TypedDict, List
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage
from pydantic import BaseModel, Field


class BusinessInfo(BaseModel):
    """Core information about the user's business"""
    business_type: str = Field(..., description="Type/category of business (e.g. cafe, online store, consulting)")
    business_stage: str = Field(..., description="Current stage (idea, startup, growth, mature)")
    location: str | None = None
    team_size: int | None = None
    monthly_revenue: float | None = Field(None, description="Approximate monthly revenue in USD")
    monthly_expenses: float | None = None
    main_goal: str = Field(..., description="Primary business goal right now")
    other_goals: List[str] = Field(default_factory=list)


class AgentState(TypedDict):
    """
    The state that flows through our graph.
    Every node can read from and write to this state.
    """
    # Business context — filled once at the beginning
    business: BusinessInfo

    # Conversation history (useful for context and memory)
    messages: Annotated[List[BaseMessage], add_messages]

    # The current "working draft" of our main output
    current_strategy: str | None

    # Structured outputs from different agents
    generated_recommendations: str | None
    critique: str | None
    refined_strategy: str | None

    # Control flow flags
    needs_refinement: bool = False
    max_refinement_rounds: int = 3
    current_refinement_round: int = 0

    # Final collected output pieces
    final_report: str | None
    visualization_code: str | None  # python code for plotly or matplotlib