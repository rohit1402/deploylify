# Deploymate

A CLI tool that helps developers set up automated deployment of services to AWS EC2 instances via GitHub Actions.

## Features

- Simple configuration file for deployment settings
- Automatic GitHub Actions workflow generation
- Support for Node.js and Docker projects
- Secure deployment using SSH keys
- Zero-config deployment process
- Secure environment variable handling via GitHub secrets

## Installation

```bash
npm install -g deploymate
```

## Usage

1. Initialize a new configuration:

```bash
deploymate init
```

This will create a `cicd.config.json` file with your deployment settings.

2. Generate the GitHub Actions workflow:

```bash
deploymate generate
```

This creates the `.github/workflows/deploy.yml` file that handles the automated deployment.

3. Add required secrets to your GitHub repository:
   > [Learn how to add secrets to your repository](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository)

   Required secrets:
   - `EC2_HOST`: Your EC2 instance's public DNS or IP
   - `EC2_USER`: SSH user (usually 'ubuntu')
   - `EC2_KEY`: Base64-encoded SSH private key ([how to create and encode SSH keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent))
     ```bash
     # Generate SSH key
     ssh-keygen -t rsa -b 4096 -C "your_email@example.com" -f ./deploy_key
     
     # Base64 encode the private key (the content will be your EC2_KEY secret)
     cat deploy_key | base64
     
     # Copy the public key to your EC2 instance's authorized_keys
     cat deploy_key.pub >> ~/.ssh/authorized_keys
     ```
   - `EC2_DEPLOY_PATH`: Path on EC2 where code will be deployed
   - Each variable listed in your config's `private` array

4. Push your code to trigger the deployment:

```bash
git add .
git commit -m "Setup CI/CD with deploymate"
git push
```

## Prerequisites

Before using Deploymate, ensure you have:

1. An AWS EC2 instance running:
   - [Launch a new EC2 instance](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html)
   - [Connect to your instance](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AccessingInstances.html)

2. Required software on your EC2 instance:
   - Git: `sudo apt-get update && sudo apt-get install git`
   - For Node.js projects:
     - [Install Node.js](https://nodejs.org/en/download/package-manager#debian-and-ubuntu-based-linux-distributions)
     - [Install PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)
   - For Docker projects:
     - [Install Docker on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
     - [Post-installation steps for Linux](https://docs.docker.com/engine/install/linux-postinstall/)

3. GitHub repository with:
   - [Actions enabled](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)
   - [Secrets configured](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## Configuration

The `cicd.config.json` file supports the following options:

```json
{
  "type": "node",             // "node" or "docker"
  "build": "npm run build",   // Optional build command
  "test": "npm test",        // Optional test command
  "deployBranch": "main",    // Branch that triggers deployment
  "ec2": {
    "host": "ec2-xx-xx.amazonaws.com",  // Used for local testing
    "user": "ubuntu",                   // Used for local testing
    "deployPath": "/home/ubuntu/app"    // Where to deploy on EC2
  },
  "env": {                    // Optional environment configuration
    "general": {              // Non-sensitive environment variables
      "NODE_ENV": "production",
      "PORT": "3000",
      "LOG_LEVEL": "info"
    },
    "private": [             // Names of sensitive environment variables
      "DATABASE_URL",        // Each name must match a GitHub secret
      "API_KEY",
      "JWT_SECRET"
    ]
  }
}
```

Note: SSH authentication is handled entirely through the `EC2_KEY` GitHub secret, not through local SSH keys. This ensures better security and easier setup across different development machines.

## Environment Variables

Deploymate supports two types of environment variables:

### 1. General Environment Variables
These are non-sensitive variables that can be directly specified in your `cicd.config.json`:

```json
"env": {
  "general": {
    "NODE_ENV": "production",
    "PORT": "3000",
    "LOG_LEVEL": "info"
  }
}
```

### 2. Private Environment Variables
These are sensitive variables that are stored securely as individual GitHub secrets:

1. List the private variable names in your config:
```json
"env": {
  "private": ["DATABASE_URL", "API_KEY", "JWT_SECRET"]
}
```

2. Add each variable as a separate GitHub secret:
   - Go to `Settings > Secrets and variables > Actions` in your repository
   - For each variable in your `private` array, create a secret with the exact same name
   - [Detailed guide on managing repository secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository)

## Docker Support

For Docker projects (`"type": "docker"`), ensure you have:

1. A valid `Dockerfile` in your project root
   - [Best practices for writing Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
   - [Example Node.js Dockerfile](https://nodejs.org/en/docs/guides/nodejs-docker-webapp)

2. Docker installed on your EC2 instance:
   ```bash
   # Install Docker on Ubuntu
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Add your user to docker group (requires re-login)
   sudo usermod -aG docker $USER
   ```
   [Full Docker installation guide](https://docs.docker.com/engine/install/ubuntu/)

3. Proper permissions to run Docker commands:
   - [Post-installation steps for Linux](https://docs.docker.com/engine/install/linux-postinstall/)
   - [Docker permission best practices](https://docs.docker.com/engine/security/rootless/)

## Security Best Practices

1. EC2 Security:
   - [AWS security best practices](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-security.html)
   - Use security groups to limit access
   - Keep your system updated
   - Use strong SSH keys

2. GitHub Actions Security:
   - [Security hardening for GitHub Actions](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
   - Never print secrets in logs
   - Use minimum required permissions
   - Regularly rotate secrets

3. Docker Security:
   - [Docker security best practices](https://docs.docker.com/develop/security-best-practices/)
   - Keep base images updated
   - Use multi-stage builds
   - Run containers with least privilege

## Troubleshooting

Common issues and solutions:

1. SSH Connection Issues:
   - [Troubleshoot EC2 SSH connections](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/TroubleshootingInstancesConnecting.html)
   - Verify security group settings
   - Check SSH key permissions

2. Docker Issues:
   - [Docker troubleshooting guide](https://docs.docker.com/engine/troubleshooting/)
   - Check Docker service status
   - Verify user permissions

3. GitHub Actions Issues:
   - [Troubleshooting GitHub Actions](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows)
   - Check workflow run logs
   - Verify secret names and values

## License

MIT
