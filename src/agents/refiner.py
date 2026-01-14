from typing import Dict, Any
from langchain_core.messages import HumanMessage, AIMessage

from src.agents.base_agent import BaseAgent
from src.graphs.state import AgentState


class RefinerAgent(BaseAgent):
    """Takes critique and improves the original strategy"""

    SYSTEM_PROMPT = """You are an expert business strategy refiner.
Your task is to take the original proposed strategy and the critic's feedback,
then create a clearly improved, more realistic and actionable version.

Rules you MUST follow:
- Directly address EVERY major weakness and red flag mentioned in the critique
- Incorporate every specific improvement suggestion from the critic
- Keep and strengthen the parts the critic marked as good/strong
- Make the plan more specific, measurable and realistic for a small team in Anuradhapura
- Adjust timelines, budgets and expectations considering local realities (limited capital, power issues, seasonal factors, etc.)
- Improve prioritization — what should really come first?
- Add missing practical details (approximate costs in LKR, who does what, how to measure success)
- Maintain clear structure with headings and bullets
- Keep language simple, motivating but grounded

Never ignore serious concerns raised by the critic.
If the original plan was unrealistic in some area, significantly scale it back or replace it.

Output format:
1. Improved Short-term Actions (1–3 months)
2. Improved Medium-term Strategies (3–12 months)
3. Key Changes Made & Why
4. Remaining Risks & How to Mitigate Them
5. Success Metrics / Early Indicators
"""

    def __init__(self):
        super().__init__(
            name="Refiner",
            system_prompt=self.SYSTEM_PROMPT,
            temperature=0.65   # balanced - creative enough but still grounded
        )

    def run(self, state: AgentState) -> Dict[str, Any]:
        if not state.get("generated_recommendations"):
            return {"refined_strategy": "No original strategy available."}
        if not state.get("critique"):
            return {"refined_strategy": "No critique available yet. Cannot refine."}

        business = state["business"]
        original = state["generated_recommendations"]
        critique = state["critique"]

        refine_prompt = f"""Business context:
{business.model_dump_json(indent=2)}

Original strategy:
{original}

Critic's feedback (address ALL points):
{critique}

Create a significantly improved version following the instructions above."""

        refined_text = self.invoke(refine_prompt)

        return {
            "refined_strategy": refined_text,
            "current_strategy": refined_text,  # now this is the best version
            "needs_refinement": False,         # we can reset this flag
            "messages": state["messages"] + [
                HumanMessage(content=refine_prompt),
                AIMessage(content=refined_text)
            ]
        }