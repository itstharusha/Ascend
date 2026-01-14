from typing import Literal, Optional
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from src.agents.strategy_generator import StrategyGeneratorAgent
from src.agents.critic import CritiqueAgent
from src.agents.refiner import RefinerAgent
from src.agents.visualizer import VisualizerAgent
from src.graphs.state import AgentState


_graph = None
_generator: Optional[StrategyGeneratorAgent] = None
_critic: Optional[CritiqueAgent] = None
_refiner: Optional[RefinerAgent] = None
_visualizer: Optional[VisualizerAgent] = None


def get_graph():
    """
    Lazily build the LangGraph workflow.

    This keeps imports fast and allows the FastAPI server to boot even when
    LLM credentials aren't configured (only consultation creation needs them).
    """
    global _graph, _generator, _critic, _refiner, _visualizer
    if _graph is not None:
        return _graph

    # Initialize agents once
    _generator = StrategyGeneratorAgent()
    _critic = CritiqueAgent()
    _refiner = RefinerAgent()
    _visualizer = VisualizerAgent()

    def generate_node(state: AgentState) -> AgentState:
        """Run strategy generator"""
        update = _generator.run(state)  # type: ignore[union-attr]
        return {**state, **update}

    def critique_node(state: AgentState) -> AgentState:
        """Run critic"""
        update = _critic.run(state)  # type: ignore[union-attr]
        return {**state, **update}

    def refine_node(state: AgentState) -> AgentState:
        """Run refiner"""
        update = _refiner.run(state)  # type: ignore[union-attr]
        return {**state, **update}

    def visualize_node(state: AgentState) -> AgentState:
        """Run visualizer"""
        update = _visualizer.run(state)  # type: ignore[union-attr]
        return {**state, **update}

    # Build the graph
    workflow = StateGraph(state_schema=AgentState)

    workflow.add_node("generate", generate_node)
    workflow.add_node("critique", critique_node)
    workflow.add_node("refine", refine_node)
    workflow.add_node("visualize", visualize_node)

    # Edges
    workflow.add_edge(START, "generate")
    workflow.add_edge("generate", "critique")
    workflow.add_edge("critique", "refine")

    # After refine → decide whether to loop or go to visualize
    workflow.add_conditional_edges(
        "refine",
        decide_refinement,
        {
            "refine": "critique",      # loop back to critique
            "visualize": "visualize"
        }
    )

    workflow.add_edge("visualize", END)

    # For now we use simple in-memory checkpointer
    memory = MemorySaver()
    _graph = workflow.compile(checkpointer=memory)
    return _graph


def decide_refinement(state: AgentState) -> Literal["refine", "visualize"]:
    """
    Simple decision: refine again or go to visualization
    For the first version we do only ONE refinement round
    """
    # You can make this smarter later (count rounds, quality score, etc.)
    if state.get("needs_refinement", False) and state.get("current_refinement_round", 0) < state.get("max_refinement_rounds", 3):
        return "refine"
    return "visualize"


graph = None  # backwards-compat; prefer get_graph()