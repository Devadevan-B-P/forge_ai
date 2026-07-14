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
  sampleRequest: string;
  sampleResponse: string;
}

export interface TimelinePhase {
  phase: string;
  description: string;
  days: number;
}

export interface PromptAnalysis {
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

export interface PrdStructure {
  documentMetadata: {
    ownership: string;
    deploymentTarget: string;
    versionStatus: string;
  };
  executiveSummary: string;
  userPersonas: Array<{ persona: string; description: string }>;
  functionalRequirements: Array<{ requirement: string; priority: string }>;
  uxDesign: {
    interfaceOverview: string;
    layoutDescription: string;
  };
  nonFunctionalRequirements: Array<{ requirement: string; type: string }>;
  metricsSuccess: Array<{ metric: string; target: string }>;
  risksDependencies: Array<{ risk: string; mitigation: string }>;
}

export interface Blueprint {
  promptAnalysis: PromptAnalysis;
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
}
