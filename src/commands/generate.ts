import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { Config } from '../types';
import { processTemplate } from '../utils/template';

const TEMPLATE_PATH = path.join(__dirname, '../../templates/github/deploy.yaml');
const CONFIG_PATH = path.join(process.cwd(), 'deploy.json');

export async function generateCommand() {
  console.log(chalk.blue('Generating GitHub Actions workflow...'));

  if (!await fs.pathExists(CONFIG_PATH)) {
    console.error(chalk.red('Error: deploy.json not found'));
    console.log('Run ' + chalk.cyan('deploylify init') + ' first to create a configuration');
    process.exit(1);
  }

  try {
    const config: Config = await fs.readJSON(CONFIG_PATH);

    if (!config.type || !config.deployBranch || !config.ec2) {
      console.error(chalk.red('Error: Invalid configuration'));
      console.log('Please ensure your deploy.json contains all required fields');
      process.exit(1);
    }

    const workflowDir = path.join(process.cwd(), '.github/workflows');
    await fs.ensureDir(workflowDir);

    const template = await fs.readFile(TEMPLATE_PATH, 'utf8');

    const workflow = processTemplate(template, config);

    const workflowPath = path.join(workflowDir, 'deploy.yml');
    await fs.writeFile(workflowPath, workflow);

    console.log(chalk.green('\n✓ GitHub Actions workflow created: .github/workflows/deploy.yml'));
    console.log(chalk.yellow('\nNext steps:'));
    console.log('1. Commit and push the workflow file');
    console.log('2. Add the following secrets to your GitHub repository:');
    console.log('   - EC2_HOST: ' + config.ec2.host);
    console.log('   - EC2_USER: ' + config.ec2.user);
    console.log('   - EC2_KEY: Your base64-encoded private key');
    console.log('   - EC2_DEPLOY_PATH: ' + config.ec2.deployPath);
    
    if (config.type === 'node') {
      console.log(chalk.yellow('\nNode.js specific instructions:'));
      console.log('1. Ensure PM2 is installed on your EC2 instance: npm install -g pm2');
      console.log('2. Make sure your package.json has a valid "start" script');
    } else if (config.type === 'docker') {
      console.log(chalk.yellow('\nDocker specific instructions:'));
      console.log('1. Ensure Docker is installed on your EC2 instance:');
      console.log('   sudo apt-get update && sudo apt-get install -y docker.io');
      console.log('2. Add EC2 user to docker group:');
      console.log('   sudo usermod -aG docker $USER');
      console.log('3. Verify your Dockerfile is in the project root');
      console.log('4. Ensure your EC2 instance has enough storage for Docker images');
    }
  } catch (error: any) {
    console.error(chalk.red('Error generating workflow:'), error.message || error);
    process.exit(1);
  }
}
