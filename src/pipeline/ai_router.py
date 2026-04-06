import os
from typing import Optional, Any
from langchain_groq import ChatGroq
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain_core.language_models import BaseChatModel
import logging

logger = logging.getLogger(__name__)

class AIRouter:
    """
    Modular Multi-Provider AI Router for UWM.
    Default: Groq (Llama 3.3 70B)
    Secondary: Anthropic (Claude 3.5)
    Fallback: Groq (8B) or local Ollama
    """
    def __init__(self):
        self.preferred_provider = os.getenv("AI_PREFERRED_PROVIDER", "groq").lower()
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")

        # Models from env - using 8B models as default to avoid 429 TPD limits
        self.groq_main_model = os.getenv("GROQ_PREFERRED_MODEL", "llama-3.1-8b-instant")
        self.groq_fallback_model = os.getenv("GROQ_FALLBACK_MODEL", "llama3-8b-8192")

    def get_model(self, force_provider: Optional[str] = None) -> BaseChatModel:
        """
        Retrieves the appropriate LLM based on preference and availability.
        """
        provider = force_provider or self.preferred_provider

        # --- GROQ (Preferred) ---
        if provider == "groq" and self.groq_api_key:
            try:
                return ChatGroq(
                    model=self.groq_main_model,
                    api_key=self.groq_api_key,
                    temperature=0.1
                )
            except Exception as e:
                logger.warning(f"Groq primary model failed, falling back to instant: {e}")
                return ChatGroq(
                    model=self.groq_fallback_model,
                    api_key=self.groq_api_key
                )

        # --- ANTHROPIC (Secondary) ---
        elif provider == "anthropic" and self.anthropic_api_key:
            return ChatAnthropic(
                model="claude-3-5-sonnet-20240620",
                api_key=self.anthropic_api_key
            )

        # --- OPENAI (Tertiary) ---
        elif (provider == "openai" or not self.groq_api_key) and self.openai_api_key:
            return ChatOpenAI(
                model="gpt-4o-mini",
                api_key=self.openai_api_key
            )

        # --- LOCAL FALLBACK ---
        logger.error("No valid AI provider found. Check your API keys.")
        raise ValueError("AI_ROUTER_ERROR: No provider available.")

    def run_inference(self, prompt: str, provider: Optional[str] = None) -> Any:
        # High level wrapper for simple calls
        llm = self.get_model(force_provider=provider)
        return llm.invoke(prompt)
