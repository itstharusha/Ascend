from src.agents.refiner import RefinerAgent
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

# You can use real outputs from previous agents or use these samples
sample_strategy = """
1. Short-term Actions:
   - Launch loyalty program with 10% off
   - Run Facebook ads (LKR 50,000 budget)
   - Introduce 3 new seasonal drinks
"""

sample_critique = """
Overall quality score: 4/10

Strong points:
- Loyalty program is a good idea for repeat customers

Major weaknesses:
- LKR 50,000 Facebook ads budget is unrealistic for a startup with unknown revenue
- No mention of local payment preferences (cash still dominates)
- New drinks without cost/profitability analysis
- No consideration of power cuts affecting equipment

Missing elements:
- Foot traffic analysis in Anuradhapura
- Partnerships with local tuk-tuk drivers or schools
- Basic break-even calculation
"""

state = AgentState(
    business=business,
    messages=[],
    generated_recommendations=sample_strategy,
    critique=sample_critique,
    needs_refinement=True
)

refiner = RefinerAgent()
result = refiner.run(state)

print("Refined Strategy:\n")
print(result["refined_strategy"])