from crewai import Crew
from agents import get_agents
from tasks import get_tasks
import time

def run_crew(destination):
    time.sleep(2)   # prevents rate spike
    data_agent, safety_agent, route_agent, decision_agent = get_agents()

    tasks = get_tasks(
        data_agent,
        safety_agent,
        route_agent,
        decision_agent,
        destination
    )

    crew = Crew(
        agents=[data_agent, safety_agent, route_agent, decision_agent],
        tasks=tasks,
        verbose=True
    )

    result = crew.kickoff()
    return result