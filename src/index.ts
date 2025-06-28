#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { generateCommand } from './commands/generate';
import { version as packageVersion } from './../package.json'

const program = new Command();

program
  .name('deploymate')
  .description('CI/CD automation for AWS EC2 deployments')
  .version(packageVersion);

program
  .command('init')
  .description('Initialize deploymate configuration')
  .option('-y, --yes', 'Use default values without prompting')
  .action(initCommand);

program
  .command('generate')
  .description('Generate GitHub Actions workflow')
  .action(generateCommand);

program.parse();
