from src.graphs.state import BusinessInfo, AgentState
from src.schemas.input import BusinessInput
from src.utils.llm import get_llm


def main():
    # Simulate user input
    user_data = {
        "business_type": "specialty coffee shop",
        "business_stage": "startup",
        "location": "Anuradhapura, Sri Lanka",
        "team_size": 4,
        "monthly_revenue_usd": 2800,
        "monthly_expenses_usd": 4200,
        "main_goal": "Reach break-even point within next 6 months",
        "other_goals": ["Build loyal customer base", "Start online sales"]
    }

    input_model = BusinessInput(**user_data)
    business = BusinessInfo(**input_model.model_dump())

    state = AgentState(
        business=business,
        messages=[],
        current_strategy=None,
        needs_refinement=False
    )

    print("Business info parsed successfully:")
    print(state["business"].model_dump_json(indent=2))

    llm = get_llm()
    print("\nLLM connection test:")
    print(llm.invoke("Say 'Phase 2 infrastructure ready!'").content)


if __name__ == "__main__":
    main()