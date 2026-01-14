# src/test_visualizer.py

from src.agents.visualizer import VisualizerAgent
from src.graphs.state import AgentState, BusinessInfo

business = BusinessInfo(
    business_type="specialty coffee shop",
    business_stage="startup",
    location="Anuradhapura, Sri Lanka",
    team_size=4,
    monthly_revenue=None,
    monthly_expenses=None,
    main_goal="Reach break-even point within next 6 months",
    other_goals=["Build loyal customer base", "Start online sales"]
)

sample_refined_strategy = """
Improved Short-term Actions:
- Start with low-cost loyalty program (stamp card, cost ~LKR 15,000)
- Focus on local WhatsApp marketing & signage (LKR 8,000 budget)
- Optimize menu to high-margin items only

Projected monthly revenue growth:
Month 1: 3200 USD
Month 2: 3800 USD
Month 3: 4500 USD
Month 4–6: 5200–6000 USD
"""

state = AgentState(
    business=business,
    messages=[],
    refined_strategy=sample_refined_strategy
)

agent = VisualizerAgent()
result = agent.run(state)

print("Generated Visualization Code:\n")
print("-" * 60)
print(result["visualization_code"])
print("-" * 60)