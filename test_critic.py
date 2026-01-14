from src.agents.critic import CritiqueAgent
from src.graphs.state import AgentState, BusinessInfo

# Use the same example business
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

# You can paste here the output you got from strategy generator
# (or leave it as placeholder for now)
sample_strategy = """
1. Short-term Actions:
   - Launch loyalty program
   - Run social media ads
   - Introduce new menu items
"""

state = AgentState(
    business=business,
    messages=[],
    generated_recommendations=sample_strategy
)

critic = CritiqueAgent()
updated = critic.run(state)

print("Critique:\n")
print(updated["critique"])