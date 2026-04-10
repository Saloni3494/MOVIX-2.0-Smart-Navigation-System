from crewai import Agent, LLM
import os
from dotenv import load_dotenv

load_dotenv()

llm = LLM(
    model="groq/llama-3.1-8b-instant",   # ✅ FINAL WORKING MODEL
    api_key=os.getenv("GROQ_API_KEY"),
    max_tokens=300   # ✅ VERY IMPORTANT
)

def get_agents():
    return [
        Agent(
            role="Data Aggregator",
            goal="Analyze crowd, sensor, and historical data",
            backstory="Expert in combining real-time accessibility data",
            llm=llm,
            verbose=True
        ),
        Agent(
            role="Safety Analyzer",
            goal="Evaluate risks and unsafe conditions",
            backstory="Specialist in hazard detection",
            llm=llm,
            verbose=True
        ),
        Agent(
            role="Route Planner",
            goal="Generate optimized routes",
            backstory="Expert in navigation systems",
            llm=llm,
            verbose=True
        ),
        Agent(
            role="Decision Maker",
            goal="Select the best route",
            backstory="Final authority for decision making",
            llm=llm,
            verbose=True
        )
    ]