from typing import Literal
from pydantic import BaseModel, Field

Level = Literal["Low", "Medium", "High"]

class Stage(BaseModel):
    period: str
    headline: str
    summary: str
    icon: str
    consequences: list[str]
    winners: list[str]
    losers: list[str]
    uncertainty_level: Level

class Decision(BaseModel):
    id: Literal["A", "B", "C"]
    title: str
    description: str

class Simulation(BaseModel):
    can_simulate: bool
    refusal_reason: str
    scenario_title: str
    summary: str
    assumptions: list[str]
    timeline: list[Stage]
    key_effects: list[str]
    second_order_effects: list[str]
    risks: list[str]
    benefits: list[str]
    decisions: list[Decision]

class BranchResult(BaseModel):
    decision_explanation: str
    how_it_differs: str
    timeline: list[Stage]
    key_effects: list[str]
    risks: list[str]
    benefits: list[str]

class SimRequest(BaseModel):
    scenario: str = Field(min_length=10, max_length=500)

class Context(BaseModel):
    title: str = Field(max_length=200)
    summary: str = Field(max_length=1200)
    assumptions: list[str] = Field(max_length=8)
    key_effects: list[str] = Field(max_length=8)
    stage_headlines: list[str] = Field(max_length=5)

class BranchRequest(BaseModel):
    scenario: str = Field(min_length=10, max_length=500)
    context: Context
    decision: Decision
