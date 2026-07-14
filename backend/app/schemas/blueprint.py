from typing import Any, Optional
from pydantic import BaseModel, Field


class BlueprintConfig(BaseModel):
    architectureStyle: str = Field(default="Monolithic")
    database: str = Field(default="PostgreSQL")
    backend: str = Field(default="FastAPI")
    frontend: str = Field(default="React")
    cloudProvider: str = Field(default="AWS")
    projectSize: str = Field(default="MVP")


class BlueprintRequest(BaseModel):
    idea: str
    config: BlueprintConfig


class PromptAnalysis(BaseModel):
    industry: str
    businessType: str
    complexity: str
    expectedUsers: str
    scale: str
    budget: str
    cloudRequirements: str
    compliance: str
    estimatedTimeline: str


class PrdDocumentMetadata(BaseModel):
    ownership: str
    deploymentTarget: str
    versionStatus: str


class PrdPersona(BaseModel):
    persona: str
    description: str


class PrdRequirement(BaseModel):
    requirement: str
    priority: str


class PrdUxDesign(BaseModel):
    interfaceOverview: str
    layoutDescription: str


class PrdNonFunctionalRequirement(BaseModel):
    requirement: str
    type: str


class PrdMetric(BaseModel):
    metric: str
    target: str


class PrdRisk(BaseModel):
    risk: str
    mitigation: str


class PrdStructure(BaseModel):
    documentMetadata: PrdDocumentMetadata
    executiveSummary: str
    userPersonas: list[PrdPersona]
    functionalRequirements: list[PrdRequirement]
    uxDesign: PrdUxDesign
    nonFunctionalRequirements: list[PrdNonFunctionalRequirement]
    metricsSuccess: list[PrdMetric]
    risksDependencies: list[PrdRisk]


# The AI is asked to return an object matching this shape. We keep it loose
# (dict-friendly) since the LLM output structure is fairly deep/nested and we
# don't want brittle validation to reject good-enough output.
class BlueprintResponse(BaseModel):
    promptAnalysis: PromptAnalysis
    prd: PrdStructure
    overview: str
    features: dict[str, list[str]]
    techStack: dict[str, Any]
    database: dict[str, Any]
    apis: list[dict[str, Any]]
    folderStructure: dict[str, Any]
    awsArchitecture: dict[str, Any]
    dockerArchitecture: dict[str, Any]
    timeline: list[dict[str, Any]]
    security: list[str]
    scalability: list[str]
    futureEnhancements: list[str]


class SqlGenerateRequest(BaseModel):
    database: dict[str, Any]
    dialect: str = Field(default="PostgreSQL")


class EndpointGenerateRequest(BaseModel):
    endpoint: dict[str, Any]
    framework: str = Field(default="FastAPI")


class CodeResponse(BaseModel):
    code: str
    language: str
