# src/agents/visualizer.py

from typing import Dict, Any
from langchain_core.messages import HumanMessage, AIMessage

from src.agents.base_agent import BaseAgent
from src.graphs.state import AgentState


class VisualizerAgent(BaseAgent):
    """
    Generates Python code (using plotly) that visualizes important business metrics
    and projections based on the refined strategy.
    """

    SYSTEM_PROMPT = """You are an expert at creating clear, professional business visualizations using Python and Plotly.

Your ONLY output must be valid, complete, ready-to-run Python code that:
- Uses ONLY plotly.express and plotly.graph_objects (import them!)
- Creates at least one meaningful chart relevant to the business situation
- Uses a professional, clean look (template='plotly_white' or similar)
- Has clear title, axis labels, and legend
- Shows realistic example data derived from the business context & strategy
- Does NOT contain explanations or comments outside the code
- Ends with fig.show() or return fig (both acceptable)

Common chart types you should consider:
- Line chart for revenue/expense projection over months
- Bar chart for comparing scenarios (base / optimistic / pessimistic)
- Simple waterfall chart for cash flow
- Pie chart for expense breakdown (if relevant)
- Funnel chart for customer acquisition (if marketing focused)

Never output markdown, explanations, or natural language outside the code block.
Output ONLY the Python code.
"""

    def __init__(self):
        super().__init__(
            name="Visualizer",
            system_prompt=self.SYSTEM_PROMPT,
            temperature=0.35   # very low → we want deterministic, correct code
        )

    def run(self, state: AgentState) -> Dict[str, Any]:
        business = state["business"]
        strategy = state.get("refined_strategy") or state.get("generated_recommendations", "No strategy available yet")

        if not strategy or "No" in strategy:
            return {"visualization_code": "# No valid strategy to visualize yet"}

        viz_prompt = f"""Business context:
{business.model_dump_json(indent=2)}

Current best strategy / recommendations:
{strategy[:2500]}  # truncate if too long

Create Python code using plotly that creates 1–2 most relevant business visualizations.
Focus on financial aspects (cash flow, break-even, revenue projection) since the main goal is reaching break-even.

Output ONLY the Python code. Nothing else."""

        code_response = self.invoke(viz_prompt)

        # Very basic cleanup - sometimes model adds markdown fences
        cleaned_code = code_response.strip()
        if cleaned_code.startswith("```python"):
            cleaned_code = cleaned_code.split("```python")[1].split("```")[0].strip()
        if cleaned_code.startswith("```"):
            cleaned_code = cleaned_code.split("```")[1].strip()

        return {
            "visualization_code": cleaned_code,
            "messages": state["messages"] + [
                HumanMessage(content=viz_prompt),
                AIMessage(content=f"[Visualization code generated]\n\n{cleaned_code}")
            ]
        }