export interface Config {
  type: 'node' | 'docker';
  build?: string;
  test?: string;
  deployBranch: string;
  ec2: {
    host: string;
    user: string;
    deployPath: string;
  };
  deployment?: {
    appName?: string;
    port?: number;
  };
  env?: {
    general?: { [key: string]: string };
    private?: string[];
  };
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface DeploymentScript {
  setup: string;
  healthCheck: string;
}

export interface DeploymentScripts {
  [key: string]: DeploymentScript;
}

export interface DeploymentConfig {
  appName: string;
  port: number;
}

export interface TemplateReplacements {
  [key: string]: string;
}
