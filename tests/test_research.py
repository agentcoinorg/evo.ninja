import pytest 
from evo_researcher.main import research_langchain
from evo_researcher.autonolas.research import make_prediction, research as research_autonolas

dataset = [
    "Will Vladimir Putin run for the president of Russia in 2024?",
    "Will TSMC start 4-nanometer chip production in its Phoenix, Arizona factory by the end of 2025?",
    "Will Twitter implement a new misinformation policy before the 2024 elections?",
    "Will the goal of not surpassing 1.5 degrees Celsius set by the Paris Agreement be reached by 2030?",
    "Will civilians die from a nuclear bomb before 2030?",
    "Will Florida still be a member state of the USA after the conclusion of 2030?",
    "Will Tether collapse and take down the whole crypto market before the end of 2024?",
]

@pytest.mark.skip("Not implemented")
@pytest.mark.parametrize("question", [question for question in dataset])
def test_research(question: str):
    evo_research = research_langchain(question)
    autonolas_research = research_autonolas(question)
    
    prediction_with_evo_research = make_prediction(question, evo_research)
    prediction_with_autonolas_research = make_prediction(question, autonolas_research)
    
    assert prediction_with_evo_research["info_utility"] > prediction_with_autonolas_research["info_utility"]
