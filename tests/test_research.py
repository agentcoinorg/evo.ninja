import pytest
from evo_researcher.functions.grade_info import grade_info 
from evo_researcher.test import research
from evo_researcher.autonolas.research import research as research_autonolas

dataset = [
    "Will Vladimir Putin run for the president of Russia in 2024?",
    "Will TSMC start 4-nanometer chip production in its Phoenix, Arizona factory by the end of 2025?",
    "Will Twitter implement a new misinformation policy before the 2024 elections?",
    "Will the goal of not surpassing 1.5 degrees Celsius set by the Paris Agreement be reached by 2030?",
    "Will civilians die from a nuclear bomb before 2030?",
    "Will Florida still be a member state of the USA after the conclusion of 2030?",
    "Will Tether collapse and take down the whole crypto market before the end of 2024?",
]

@pytest.mark.parametrize("question", [pytest.param(question, id=question) for question in dataset])
def test_research(question: str):
    evo_research = research(question)
    autonolas_research = research_autonolas(question)
    
    evo_research_score = grade_info(evo_research, question)
    autonolas_research_score = grade_info(autonolas_research, question)
    
    assert evo_research_score.final_grade.grade > autonolas_research_score.final_grade.grade
