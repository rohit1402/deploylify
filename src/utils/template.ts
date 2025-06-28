import { Config, TemplateReplacements } from '../types';
import { createDeploymentScripts } from './deployment-scripts';

/**
 * Constants for GitHub Actions setup
 */
const GITHUB_ACTIONS = {
  NODE_VERSION: '18'
};

/**
 * Generates environment variable secret configurations
 */
const getEnvSecrets = (config: Config): { envSecrets: string; envSecretNames: string } => {
  const privateEnvVars = config.env?.private || [];
  
  // Each env var on its own line with correct indentation
  const envSecrets = privateEnvVars
    .map(key => `          ${key}: \${{ secrets.${key} }}`)
    .join('\n');
    
  const envSecretNames = privateEnvVars.join(',');
  
  return { envSecrets, envSecretNames };
};

/**
 * Generates the Node.js setup steps for GitHub Actions
 */
const getNodeSetup = (config: Config): string => {
  if (config.type !== 'node') return '';
  
  return `
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '${GITHUB_ACTIONS.NODE_VERSION}'

      - name: Install dependencies
        run: npm ci
`;
};

/**
 * Generates the build step for GitHub Actions if configured
 */
const getBuildStep = (config: Config): string => {
  if (!config.build) return '';
  
  return `
      - name: Build
        run: ${config.build}
`;
};

/**
 * Generates the test step for GitHub Actions if configured
 */
const getTestStep = (config: Config): string => {
  if (!config.test) return '';
  
  return `
      - name: Test
        run: ${config.test}
`;
};

/**
 * Generates the remote deployment commands based on project type
 */
const getRemoteCommands = (config: Config): string => {
  const deployScripts = createDeploymentScripts(config);
  const deployScript = deployScripts[config.type];
  // Add initial indentation for the entire script block
  return `            ${deployScript.setup.split('\n').join('\n            ')}
            ${deployScript.healthCheck}`;
};

/**
 * Creates a map of template variables to their values
 */
const createReplacementsMap = (config: Config): TemplateReplacements => {
  const { envSecrets, envSecretNames } = getEnvSecrets(config);
  
  return {
    '${deployBranch}': config.deployBranch,
    '${nodeSetup}': getNodeSetup(config),
    '${buildStep}': getBuildStep(config),
    '${testStep}': getTestStep(config),
    '${envSecrets}': envSecrets,
    '${envSecretNames}': envSecretNames,
    '${remoteCommands}': getRemoteCommands(config)
  };
};

/**
 * Processes a template string by replacing variables with their values
 * based on the provided configuration
 */
export function processTemplate(template: string, config: Config): string {
  const replacements = createReplacementsMap(config);

  return Object.entries(replacements).reduce(
    (result, [key, value]) => result.replace(key, value),
    template
  );
}
