import streamlit as st
import json
from pathlib import Path

from src.graphs.main_consultant_graph import graph
from src.graphs.state import AgentState, BusinessInfo
from langchain_core.messages import HumanMessage

# ── Page config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="AI Business Consultant",
    page_icon="💼",
    layout="wide"
)

st.title("AI Business Consultant")
st.markdown("Enter your business details and get tailored growth strategy + visualizations")

# ── Sidebar / Tier selection (simple mock for now) ───────────────────────────
st.sidebar.header("Consultation Level")
tier = st.sidebar.radio(
    "Choose your plan",
    ["Basic (1 refinement round)", "Premium (up to 3 rounds + more detail)"],
    index=1
)

max_rounds = 1 if tier == "Basic (1 refinement round)" else 3

# ── Form for business information ────────────────────────────────────────────
with st.form("business_form"):
    col1, col2 = st.columns(2)

    with col1:
        business_type = st.text_input("Business Type", "specialty coffee shop")
        business_stage = st.selectbox(
            "Current Stage",
            ["idea", "startup", "growth", "mature"],
            index=1
        )
        location = st.text_input("Location", "Anuradhapura, Sri Lanka")
        team_size = st.number_input("Team Size", min_value=1, value=4)

    with col2:
        monthly_revenue = st.number_input(
            "Current Monthly Revenue (USD)", min_value=0.0, value=0.0, step=100.0
        )
        monthly_expenses = st.number_input(
            "Current Monthly Expenses (USD)", min_value=0.0, value=0.0, step=100.0
        )
        main_goal = st.text_area(
            "Main Goal Right Now",
            "Reach break-even point within next 6 months",
            height=80
        )
        other_goals = st.text_input(
            "Other Goals (comma separated)",
            "Build loyal customer base, Start online sales"
        ).split(",")

    submitted = st.form_submit_button("Generate Strategy & Visuals", type="primary")

# ── Processing when form is submitted ────────────────────────────────────────
if submitted:
    with st.spinner("Running full multi-agent consultation... (this may take 30–90 seconds)"):
        try:
            # Prepare business info
            business = BusinessInfo(
                business_type=business_type.strip(),
                business_stage=business_stage,
                location=location.strip() or None,
                team_size=int(team_size),
                monthly_revenue=monthly_revenue if monthly_revenue > 0 else None,
                monthly_expenses=monthly_expenses if monthly_expenses > 0 else None,
                main_goal=main_goal.strip(),
                other_goals=[g.strip() for g in other_goals if g.strip()]
            )

            initial_state = AgentState(
                business=business,
                messages=[HumanMessage(content=f"Help me with: {main_goal}")],
                needs_refinement=True,
                max_refinement_rounds=max_rounds,
                current_refinement_round=0
            )

            config = {"configurable": {"thread_id": "streamlit_session_" + str(hash(main_goal))[:8]}}

            # Run the graph
            final_state = None
            strategy_output = ""
            viz_code = ""

            for event in graph.stream(initial_state, config, stream_mode="values"):
                if "refined_strategy" in event and event["refined_strategy"]:
                    strategy_output = event["refined_strategy"]
                if "visualization_code" in event and event["visualization_code"]:
                    viz_code = event["visualization_code"]
                final_state = event

            # ── Results display ──────────────────────────────────────────────────────
            st.success("Consultation complete!")

            tab1, tab2 = st.tabs(["📋 Strategy", "📊 Visualizations"])

            with tab1:
                st.markdown("### Final Refined Strategy")
                st.markdown(strategy_output)

            with tab2:
                st.markdown("### Generated Visualizations")
                if viz_code:
                    try:
                        # Execute the generated code safely in limited scope
                        local_vars = {}
                        exec(viz_code, {"px": __import__("plotly.express"),
                                        "pd": __import__("pandas"),
                                        "go": __import__("plotly.graph_objects")}, local_vars)

                        if "fig" in local_vars:
                            st.plotly_chart(local_vars["fig"], use_container_width=True)
                        else:
                            st.code(viz_code, language="python")
                            st.info("Chart code generated — you can copy & run it locally.")
                    except Exception as e:
                        st.error("Could not render chart automatically")
                        st.code(viz_code, language="python")
                        st.caption(f"Error: {str(e)}")
                else:
                    st.info("No visualization was generated this time.")

        except Exception as e:
            st.error(f"An error occurred during processing")
            st.exception(e)

# ── Footer / info ────────────────────────────────────────────────────────────
st.markdown("---")
st.caption("Prototype v0.1 • Powered by Groq + LangGraph • Built in Anuradhapura, Sri Lanka")