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
    history_id: str | None = None


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


class Decision(BaseModel):
    component: str
    userRequirement: str
    recommendation: str
    alternatives: list[str]
    reason: str


class PrdDocumentMetadata(BaseModel):
    ownership: str
    deploymentTarget: str
    versionStatus: str


class PrdUserStory(BaseModel):
    persona: str
    story: str


class PrdBusinessRule(BaseModel):
    rule: str


class PrdAcceptanceCriteria(BaseModel):
    feature: str
    criteria: list[str]


class PrdUxDesign(BaseModel):
    interfaceOverview: str
    layoutDescription: str


class PrdStructure(BaseModel):
    documentMetadata: PrdDocumentMetadata
    executiveSummary: str
    userStories: list[PrdUserStory]
    businessRules: list[PrdBusinessRule]
    acceptanceCriteria: list[PrdAcceptanceCriteria]
    uxDesign: PrdUxDesign
    businessFlow: list[str]
    systemFlow: list[str]


class Monitoring(BaseModel):
    tracing: str
    metrics: list[str]
    dashboards: list[str]
    healthChecks: list[str]


class EstimatedCost(BaseModel):
    aws: str
    development: str
    duration: str


class AiRecommendations(BaseModel):
    alternativeTechStack: list[str]
    potentialBottlenecks: list[str]
    scalingAdvice: list[str]
    securityAdvice: list[str]
    estimatedComplexity: str
    architectureScore: str


class Mermaid(BaseModel):
    erDiagram: str
    architectureDiagram: str
    flowDiagram: str
    sequenceDiagram: str
    deploymentDiagram: str


class BlueprintResponse(BaseModel):
    promptAnalysis: PromptAnalysis
    decisions: list[Decision]
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
    monitoring: Monitoring
    estimatedCost: EstimatedCost
    aiRecommendations: AiRecommendations
    mermaid: Mermaid


class SqlGenerateRequest(BaseModel):
    database: dict[str, Any]
    dialect: str = Field(default="PostgreSQL")
    history_id: str | None = None


class EndpointGenerateRequest(BaseModel):
    endpoint: dict[str, Any]
    framework: str = Field(default="FastAPI")
    history_id: str | None = None
    endpoint_key: str | None = None


class CodeResponse(BaseModel):
    code: str
    language: str
