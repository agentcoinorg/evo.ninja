from evo_researcher.functions.grade_info import grade_info

question = "Is nayib bukele going to run for president again?"

info = """
Yes, Nayib Bukele is planning to run for re-election as the President of El Salvador. The Salvadoran Congress has granted him a six-month leave, beginning December 1, 2023, to campaign for re-election despite constitutional prohibitions. This leave allows Bukele to seek a second five-year term for the New Ideas party in the national elections scheduled for February 4, 2024. Vice President Félix Ulloa has also been granted leave to campaign again as Bukele's running mate【6†source】【7†source】.

Bukele's re-election bid, however, is not without controversy. A ruling in 2021 by El Salvador's Supreme Court established a new procedure that allowed Bukele to run in the February 2024 elections, breaking with the tradition that a president must wait 10 years after the end of their term to run again for the presidency. This decision has been questioned by several constitutional lawyers who argue that it is not a legal mandate since the election of the magistrates did not take place according to the legal process【7†source】.

Furthermore, Bukele's candidacy has been approved by the Supreme Electoral Tribunal, which ruled earlier this month that his candidacy met the legal requirements. It's worth noting that the last time an El Salvador president sought immediate reelection was under the dictatorship of Maximiliano Hernandez Martinez in 1935【7†source】【8†source】.

Bukele's presidency is known globally for his sweeping crackdown on El Salvadoran gangs, an approach that has drawn both praise and allegations of human rights violations. His leave from the presidency does not rupture his link with the office but suspends the exercise of its competencies or public functions. During his absence, Claudia Rodriguez, the current head of the National Directorate of Municipal Works, will replace Bukele in his duties【6†source】【9†source】【10†source】.
"""

def test_grading_info():
    response = grade_info(info, question)
    
    print(response)
    
    assert False