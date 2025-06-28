import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { Config } from '../types';
import chalk from 'chalk';

const defaultConfig: Config = {
    type: 'node',
    deployBranch: 'main',
    ec2: {
        host: 'localhost',
        user: 'ubuntu',
        deployPath: '/home/ubuntu/app'
    },
    deployment: {
        appName: 'app',
        port: 3000
    },
    env: {
        general: {
            NODE_ENV: 'production',
            PORT: '3000'
        },
        private: []
    }
};

interface InitOptions {
  yes?: boolean;
}

const CONFIG_PATH = path.join(process.cwd(), 'deploy.json');

export async function initCommand(options: InitOptions) {
  console.log(chalk.blue('Initializing deploymate configuration...'));

  if (options.yes) {
    await fs.writeJSON(CONFIG_PATH, defaultConfig, { spaces: 2 });
    console.log(chalk.green('\n✓ Configuration file created with default values: deploy.json'));
    console.log(chalk.yellow('\nNext steps:'));
    console.log('1. Update deploy.json with your EC2 host and other settings');
    console.log('2. Add general environment variables in the env.general section');
    console.log('3. List private environment variables in the env.private section');
    console.log('4. Create GitHub secrets for each private environment variable');
    console.log('5. Run ' + chalk.cyan('deploymate generate') + ' to create the GitHub workflow');
    console.log('\nRequired GitHub Secrets:');
    console.log('   - EC2_HOST');
    console.log('   - EC2_USER');
    console.log('   - EC2_KEY (base64 encoded private key)');
    console.log('   - All variables listed in env.private (e.g., DATABASE_URL, API_KEY)');
    return;
  }

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'What type of project is this?',
      choices: ['node', 'docker']
    },
    {
      type: 'input',
      name: 'build',
      message: 'Build command (optional):',
    },
    {
      type: 'input',
      name: 'test',
      message: 'Test command (optional):',
    },
    {
      type: 'input',
      name: 'deployBranch',
      message: 'Which branch should trigger deployments?',
      default: defaultConfig.deployBranch
    },
    {
      type: 'input',
      name: 'ec2.host',
      message: 'EC2 host (public DNS or IP):',
    },
    {
      type: 'input',
      name: 'ec2.user',
      message: 'EC2 SSH user:',
      default: defaultConfig.ec2.user
    },
    {
      type: 'input',
      name: 'ec2.deployPath',
      message: 'Deployment path on EC2:',
      default: defaultConfig.ec2.deployPath
    },
    {
      type: 'input',
      name: 'deployment.appName',
      message: 'Application name:',
      default: defaultConfig.deployment?.appName
    },
    {
      type: 'number',
      name: 'deployment.port',
      message: 'Application port:',
      default: defaultConfig.deployment?.port
    }
  ]);

  const config: Config = {
    type: answers.type as 'node' | 'docker',
    deployBranch: answers.deployBranch,
    ec2: {
      host: answers['ec2.host'] || defaultConfig.ec2.host,
      user: answers['ec2.user'] || defaultConfig.ec2.user,
      deployPath: answers['ec2.deployPath'] || defaultConfig.ec2.deployPath
    },
    deployment: {
      appName: answers['deployment.appName'] || defaultConfig.deployment?.appName,
      port: answers['deployment.port'] || defaultConfig.deployment?.port
    },
    env: defaultConfig.env
  };

  if (answers.build) config.build = answers.build;
  if (answers.test) config.test = answers.test;

  await fs.writeJSON(CONFIG_PATH, config, { spaces: 2 });

  console.log(chalk.green('\n✓ Configuration file created: deploy.json'));
  console.log(chalk.yellow('\nNext steps:'));
  console.log('1. Review and adjust the configuration if needed');
  console.log('2. Add general environment variables in the env.general section');
  console.log('3. List private environment variables in the env.private section');
  console.log('4. Create GitHub secrets for each private environment variable');
  console.log('5. Run ' + chalk.cyan('deploymate generate') + ' to create the GitHub workflow');
  console.log('\nRequired GitHub Secrets:');
  console.log('   - EC2_HOST');
  console.log('   - EC2_USER');
  console.log('   - EC2_KEY (base64 encoded private key)');
  console.log('   - All variables listed in env.private (e.g., DATABASE_URL, API_KEY)');
}
