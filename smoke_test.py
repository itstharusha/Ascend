# src/smoke_test.py (create temporarily)
from langgraph.graph import StateGraph
from pydantic import BaseModel

class DummyState(BaseModel):
    message: str = "Hello consultant world"

print("LangGraph & Pydantic smoke test → OK")