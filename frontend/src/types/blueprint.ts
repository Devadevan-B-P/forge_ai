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

export interface Blueprint {
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
