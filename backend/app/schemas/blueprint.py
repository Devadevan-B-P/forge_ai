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


# The AI is asked to return an object matching this shape. We keep it loose
# (dict-friendly) since the LLM output structure is fairly deep/nested and we
# don't want brittle validation to reject good-enough output.
class BlueprintResponse(BaseModel):
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
