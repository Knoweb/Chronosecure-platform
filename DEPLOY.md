# ChronoSecure Deployment Guide

This guide explains how to deploy the application to a DigitalOcean Droplet using GitHub Actions for Continuous Deployment.

## 1. DigitalOcean Droplet Setup

1.  **Create a Droplet**:
    *   Image: Ubuntu 24.04 (LTS) x64
    *   Plan: Basic (Regular Intel with SSD) - $6 or $12/mo
    *   Region: Choose closest to you (e.g. SGP1 or BLR1)
    *   Authentication: SSH Key (Recommended) or Password

2.  **Access the Droplet**:
    ```bash
    ssh root@your_droplet_ip
    ```

3.  **Install Docker & Docker Compose**:
    Run these commands on the server to install Docker:
    ```bash
    # Update packages
    sudo apt update
    sudo apt install -y docker.io docker-compose-plugin

    # Enable Docker service
    sudo systemctl enable --now docker

    # Verify installation
    docker --version
    docker compose version
    ```

## 2. GitHub Secrets Configuration

Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.

Add the following secrets:

| Secret Name | Value |
| :--- | :--- |
| `DO_HOST` | The IP Address of your Droplet (e.g. `168.x.x.x`) |
| `DO_USERNAME` | `root` (or your user, e.g. `ubuntu`) |
| `DO_SSH_KEY` | Private SSH Key content (Open your local private key file and copy everything from `-----BEGIN OPENSSH PRIVATE KEY-----` to `-----END...`) |
| `DB_USERNAME` | `postgres` (or your preferred DB user) |
| `DB_PASSWORD` | A strong password for your production database |
| `MAIL_USERNAME` | `sachzrules@gmail.com` |
| `MAIL_PASSWORD` | `ijww wapm diwh tgrc` (The App Password) |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | **Paste the entire content** of your local `serviceAccountKey.json` file here. |

## 3. First Deployment

1.  Push your changes to the `main` branch.
2.  Go to the "Actions" tab in GitHub.
3.  You should see the "Deploy to DigitalOcean" workflow running.
4.  Once green, your app is live!

## 4. Verification

Visit `http://your_droplet_ip` in your browser. You should see the login page.

## Troubleshooting

- **Check Containers**: `docker compose ps`
- **Check Backend Logs**: `docker compose logs -f backend`
- **Check Database**: `docker compose exec db psql -U postgres`

---
**Note**: This setup exposes port 80 (HTTP). For production, you should set up SSL (HTTPS) later using Certbot.
