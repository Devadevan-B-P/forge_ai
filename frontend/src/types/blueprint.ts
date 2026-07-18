export interface BlueprintConfig {
  architectureStyle: string;
  database: string;
  backend: string;
  frontend: string;
  cloudProvider: string;
  projectSize: string;
}

export interface Column {
  name: string;
  type: string;
  primaryKey: boolean;
  foreignKey: string | null;
  unique: boolean;
  nullable: boolean;
  notes?: string;
}

export interface Table {
  name: string;
  columns: Column[];
}

export interface ApiEndpoint {
  method: string;
  route: string;
  description: string;
  authRequired: boolean;
  validation: string;
  headers: Array<{ name: string; description: string }>;
  statusCodes: Array<{ code: number; description: string }>;
  sampleRequest: string;
  sampleResponse: string;
  errors: Array<{ code: number; message: string }>;
}

export interface TimelinePhase {
  phase: string;
  description: string;
  days: number;
}

export interface PromptAnalysis {
  projectName: string;
  industry: string;
  businessType: string;
  complexity: string;
  expectedUsers: string;
  scale: string;
  budget: string;
  cloudRequirements: string;
  compliance: string;
  estimatedTimeline: string;
}

export interface Decision {
  component: string;
  userRequirement: string;
  recommendation: string;
  alternatives: string[];
  reason: string;
}

export interface PrdStructure {
  documentMetadata: {
    ownership: string;
    deploymentTarget: string;
    versionStatus: string;
  };
  executiveSummary: string;
  userStories: Array<{ persona: string; story: string }>;
  businessRules: Array<{ rule: string }>;
  acceptanceCriteria: Array<{ feature: string; criteria: string[] }>;
  uxDesign: {
    interfaceOverview: string;
    layoutDescription: string;
  };
  businessFlow: string[];
  systemFlow: string[];
}

export interface Monitoring {
  tracing: string;
  metrics: string[];
  dashboards: string[];
  healthChecks: string[];
}

export interface EstimatedCost {
  aws: string;
  development: string;
  duration: string;
}

export interface AiRecommendations {
  alternativeTechStack: string[];
  potentialBottlenecks: string[];
  scalingAdvice: string[];
  securityAdvice: string[];
  estimatedComplexity: string;
  architectureScore: string;
}

export interface Mermaid {
  erDiagram: string;
  architectureDiagram: string;
  flowDiagram: string;
  sequenceDiagram: string;
  deploymentDiagram: string;
}

export interface Blueprint {
  promptAnalysis: PromptAnalysis;
  decisions: Decision[];
  prd: PrdStructure;
  overview: string;
  features: { user: string[]; admin: string[]; system: string[] };
  techStack: Record<string, string[]>;
  database: { tables: Table[]; relationships: string[] };
  apis: ApiEndpoint[];
  folderStructure: { backend: string[]; frontend: string[] };
  awsArchitecture: {
    frontendHosting: string;
    backendHosting: string;
    database: string;
    storage: string;
    authentication: string;
    cdn: string;
    loadBalancer: string;
    flow: string[];
  };
  dockerArchitecture: { containers: string[]; flow: string[] };
  timeline: TimelinePhase[];
  security: string[];
  scalability: string[];
  futureEnhancements: string[];
  monitoring: Monitoring;
  estimatedCost: EstimatedCost;
  aiRecommendations: AiRecommendations;
  mermaid: Mermaid;
}
