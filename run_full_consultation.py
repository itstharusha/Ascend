from src.graphs.main_consultant_graph import graph
from src.graphs.state import AgentState, BusinessInfo
from langchain_core.messages import HumanMessage

# Your example business
business_data = BusinessInfo(
    business_type="specialty coffee shop",
    business_stage="startup",
    location="Anuradhapura, Sri Lanka",
    team_size=4,
    monthly_revenue=None,
    monthly_expenses=None,
    main_goal="Reach break-even point within next 6 months",
    other_goals=["Build loyal customer base", "Start online sales"]
)

# Initial state
initial_state = AgentState(
    business=business_data,
    messages=[HumanMessage(content="I need help reaching break-even for my coffee shop")],
    needs_refinement=True,           # allow at least one refinement
    max_refinement_rounds=2,
    current_refinement_round=0
)

# Config with thread_id (required for memory/checkpointer)
config = {"configurable": {"thread_id": "test_consultation_001"}}

print("Starting full consultation workflow...\n")

final_state = None
for event in graph.stream(initial_state, config, stream_mode="values"):
    print("→ Current step:", list(event.keys()))
    if "refined_strategy" in event and event["refined_strategy"]:
        print("\nLatest refined strategy (preview):")
        print(event["refined_strategy"][:400], "...\n")
    if "visualization_code" in event and event["visualization_code"]:
        print("\nVisualization code generated:")
        print(event["visualization_code"][:300], "...\n")

    final_state = event

print("\n" + "="*80)
print("FINAL OUTPUT SUMMARY")
print("="*80)

if final_state.get("refined_strategy"):
    print("Best Strategy:\n")
    print(final_state["refined_strategy"])
    print("\n")

if final_state.get("visualization_code"):
    print("Visualization Code (copy & run in notebook):\n")
    print(final_state["visualization_code"])