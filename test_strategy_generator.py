from src.agents.strategy_generator import StrategyGeneratorAgent
from src.graphs.state import AgentState, BusinessInfo

agent = StrategyGeneratorAgent()

# Same example data
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

state = AgentState(business=business, messages=[])

updated_state = agent.run(state)

print("Generated Recommendations:\n")
print(updated_state["generated_recommendations"])