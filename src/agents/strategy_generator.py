from typing import Dict, Any
from src.agents.base_agent import BaseAgent
from src.graphs.state import AgentState
from langchain_core.messages import HumanMessage, SystemMessage


class StrategyGeneratorAgent(BaseAgent):
    """Generates initial growth strategies and recommendations"""

    SYSTEM_PROMPT = """You are an expert business growth consultant with 15+ years experience.
You specialize in helping small and medium businesses in emerging markets.

Given the business information and the main goal, create a concise but powerful set of recommendations including:

1. 3–5 most important short-term actions (next 1–3 months)
2. 2–3 medium-term strategies (3–12 months)
3. Key marketing channels & tactics suitable for this business type/stage/location
4. Basic financial levers to improve profitability
5. Potential quick wins and early warning risks

Be realistic, specific, and culturally/business-context aware (especially for Sri Lanka / emerging markets).
Use simple, actionable language. Structure output with clear headings and bullet points."""

    def __init__(self):
        super().__init__(
            name="StrategyGenerator",
            system_prompt=self.SYSTEM_PROMPT,
            temperature=0.75
        )

    def run(self, state: AgentState) -> Dict[str, Any]:
        business = state["business"]

        prompt = f"""Business information:
{business.model_dump_json(indent=2)}

Main goal: {business.main_goal}
Other goals: {', '.join(business.other_goals)}

Generate comprehensive growth recommendations."""

        recommendations = self.invoke(prompt)

        return {
            "generated_recommendations": recommendations,
            "current_strategy": recommendations,  # initial version
            "messages": state["messages"] + [HumanMessage(content=prompt), SystemMessage(content=recommendations)]
        }