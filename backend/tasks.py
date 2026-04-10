from crewai import Task

def get_tasks(data_agent, safety_agent, route_agent, decision_agent, destination):

    task1 = Task(
        description=f"Analyze data for {destination} in short.",
        expected_output="Short summary of key obstacles (max 3 points)",
        agent=data_agent
    )

    task2 = Task(
        description="Evaluate safety risks briefly.",
        expected_output="Risk level + 2 unsafe areas only",
        agent=safety_agent
    )

    task3 = Task(
        description="Generate 2 routes only.",
        expected_output="2 routes with simple scores",
        agent=route_agent
    )

    task4 = Task(
        description="Select best route.",
        expected_output="Best route + 1-line reason",
        agent=decision_agent
    )

    return [task1, task2, task3, task4]