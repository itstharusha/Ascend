from typing import Dict, Any
from langchain_core.messages import HumanMessage, AIMessage

from src.agents.base_agent import BaseAgent
from src.graphs.state import AgentState


class CritiqueAgent(BaseAgent):
    """Strict, realistic critic that evaluates business recommendations"""

    SYSTEM_PROMPT = """You are a brutally honest, senior business advisor with deep experience in small businesses 
in emerging markets, especially Sri Lanka.

Your job is to CRITIQUE the proposed strategy very critically but constructively.
Focus on:

- Realism given the business stage, location (Anuradhapura/small town), team size, and likely limited capital
- Cultural, economic and logistical realities in Sri Lanka (power cuts, transport, payment habits, competition)
- Feasibility with very limited resources
- Missing risks (currency fluctuation, seasonal tourism, competition from chains, etc.)
- Overly optimistic assumptions
- Areas that are too vague or generic
- Potential legal/regulatory issues (food safety, taxes, permits)
- Prioritization problems (wrong order of actions)

Structure your response clearly:

1. Overall quality score (1-10)
2. Strong points (what actually makes sense)
3. Major weaknesses / red flags (be specific and harsh when needed)
4. Missing elements / blind spots
5. Specific improvement suggestions (very concrete)

Be direct, professional, and helpful — never sugarcoat serious issues."""

    def __init__(self):
        super().__init__(
            name="Critic",
            system_prompt=self.SYSTEM_PROMPT,
            temperature=0.55   # lower temperature = more focused & critical
        )

    def run(self, state: AgentState) -> Dict[str, Any]:
        if not state.get("generated_recommendations"):
            return {"critique": "No strategy was generated yet. Cannot critique."}

        business = state["business"]
        strategy = state["generated_recommendations"]

        critique_prompt = f"""Business context:
{business.model_dump_json(indent=2)}

Proposed strategy to critique:
{strategy}

Perform a rigorous, honest critique following the instructions above."""

        critique_text = self.invoke(critique_prompt)

        return {
            "critique": critique_text,
            "messages": state["messages"] + [
                HumanMessage(content=critique_prompt),
                AIMessage(content=critique_text)
            ]
        }