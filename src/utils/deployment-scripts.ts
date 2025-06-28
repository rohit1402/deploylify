import { Config, DeploymentConfig, DeploymentScripts } from '../types';

/**
 * Default values for deployment configuration
 */
const DEFAULT_CONFIG: DeploymentConfig = {
  appName: 'app',
  port: 3000
};

/**
 * Get deployment configuration with defaults
 */
const getDeploymentConfig = (config: Config): DeploymentConfig => {
  const deployment = config.deployment || {};
  return {
    appName: deployment.appName || DEFAULT_CONFIG.appName,
    port: deployment.port || DEFAULT_CONFIG.port
  };
};

/**
 * Handle environment variables setup
 */
const createEnvSetup = (config: Config): string => {
  const generalEnvVars = config.env?.general || {};
  const privateEnvVars = config.env?.private || [];
  
  const generalEnvString = Object.entries(generalEnvVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const privateEnvRefs = privateEnvVars
    .map(key => `${key}=\${{ secrets.${key} }}`)
    .join('\n');

  return `# Setup environment variables
cat > .env << EOL
${generalEnvString}
${privateEnvRefs}
EOL`;
};

/**
 * Creates git update commands
 */
const createGitCommands = (deployBranch: string): string => {
  return `# Update repository to latest code
git fetch origin ${deployBranch}
git reset --hard \${GITHUB_SHA}`;
};

/**
 * Create Docker run command with environment variables
 */
const createDockerRunCommand = (config: DeploymentConfig, imageTag: string): string => {
  return `docker run -d \\
  --name ${config.appName} \\
  --restart always \\
  -p ${config.port}:${config.port} \\
  --env-file .env \\
  ${imageTag}`;
};

/**
 * Create Docker image tag using app name and commit SHA
 */
const createDockerImageTag = (appName: string): string => 
  `${appName}:\${GITHUB_SHA:0:7}`;

/**
 * Deployment scripts for different project types
 */
export const createDeploymentScripts = (config: Config): DeploymentScripts => {
  const deployConfig = getDeploymentConfig(config);
  const dockerImageTag = createDockerImageTag(deployConfig.appName);
  const latestTag = `${deployConfig.appName}:latest`;
  
  return {
    docker: {
      setup: `cd \${{ secrets.EC2_DEPLOY_PATH }}

${createGitCommands(config.deployBranch)}

${createEnvSetup(config)}

# Build the Docker image with SHA tag and latest tag
echo "Building Docker image: ${dockerImageTag}"
DOCKER_BUILDKIT=1 docker build \\
  --build-arg NODE_ENV=production \\
  -t ${dockerImageTag} \\
  -t ${latestTag} .

# Stop and remove existing container (if running)
CONTAINER_ID=$(docker ps -qf "name=^${deployConfig.appName}$")
if [ ! -z "$CONTAINER_ID" ]; then
  echo "Stopping container: ${deployConfig.appName}"
  docker stop ${deployConfig.appName}
  docker rm ${deployConfig.appName}
fi

# Run the new container with proper configurations
echo "Starting new container with image: ${dockerImageTag}"
${createDockerRunCommand(deployConfig, dockerImageTag)}

# Clean up old images
echo "Cleaning up old images..."
docker image prune -f --filter "label=app=${deployConfig.appName}" --filter "until=24h"`,
      healthCheck: 'echo "Deployment completed successfully"'
    },
    node: {
      setup: `cd \${{ secrets.EC2_DEPLOY_PATH }}

${createGitCommands(config.deployBranch)}

${createEnvSetup(config)}

# Install production dependencies only
NODE_ENV=production npm ci --only=production

# Start/restart the application using PM2
pm2 stop ${deployConfig.appName} || true
pm2 delete ${deployConfig.appName} || true
NODE_ENV=production pm2 start npm \\
  --name "${deployConfig.appName}" \\
  --env production \\
  $([ -f .env ] && echo "--env-file .env") \\
  -- start`,
      healthCheck: 'echo "Deployment completed successfully"'
    }
  };
};
