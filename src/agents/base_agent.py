from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.language_models import BaseChatModel

from src.utils.llm import get_llm


class BaseAgent(ABC):
    """Base class for all our consultant agents"""

    def __init__(
            self,
            name: str,
            system_prompt: str,
            llm: Optional[BaseChatModel] = None,
            temperature: float = 0.7,
    ):
        self.name = name
        self.system_prompt = system_prompt
        self.llm = llm or get_llm(temperature=temperature)
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            ("placeholder", "{messages}"),
            ("human", "{input}")
        ])

    def invoke(self, input_text: str, messages: list = None) -> str:
        """Simple synchronous call - good for testing"""
        messages = messages or []

        chain = self.prompt | self.llm

        response = chain.invoke({
            "input": input_text,
            "messages": messages,
        })

        return response.content.strip()

    @abstractmethod
    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Main method that agents will implement - works with graph state"""
        pass


def create_agent(
        name: str,
        system_prompt: str,
        temperature: float = 0.7
) -> BaseAgent:
    """Factory helper for quick agent creation during development"""

    class SimpleAgent(BaseAgent):
        def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
            raise NotImplementedError("Use concrete agent classes")

    return SimpleAgent(name, system_prompt, temperature=temperature)