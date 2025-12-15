# Mail Application DevOps

Modern deployment system using Ansible and GitHub Actions for multi-environment deployments.

## 📁 Structure

```
devops/
├── .github/workflows/           # GitHub Actions workflows
│   ├── deploy-prod.yml         # Manual production deployment
│   ├── deploy-dev-new.yml      # Auto development deployment
│   ├── deploy-preview.yml      # Auto preview deployment
│   └── cleanup-preview.yml     # Auto preview cleanup
│
└── ansible/                     # Ansible deployment
    ├── deploy.yml              # Universal deployment playbook
    ├── templates/              # Jinja2 templates
    └── inventory-*.example.ini # Example inventory files
```

## 🚀 Quick Start

### Prerequisites

1. **GitHub Secrets** - Add to devops repository:
   ```
   PROD_SERVER_IP, PROD_SSH_KEY, PROD_MONGO_URI
   DEV_SERVER_IP, DEV_SSH_KEY, DEV_MONGO_URI
   PREVIEW_SERVER_IP, PREVIEW_SSH_KEY, PREVIEW_MONGO_URI
   JWT_SECRET, JWT_REFRESH_SECRET
   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
   GHCR_TOKEN, SSL_EMAIL
   ```

2. **Backend/Frontend Repositories** - Ensure PAT_TOKEN is set for triggering devops

### Deployment Flow

#### Automatic Deployments:
- **Push to `dev` branch** → Auto deploy to https://mail-dev.nguyenanhhao.site
- **Push to feature branch** → Auto deploy to https://preview-feature-x.mail-dev.nguyenanhhao.site
- **Delete feature branch** → Auto cleanup preview environment

#### Manual Deployment:
- **Production**: Go to Actions → Deploy Production → Run workflow

## 🏗️ Architecture

```
Nginx Reverse Proxy (Port 80/443)
    ↓
├─ mail.nguyenanhhao.site → prod (5000/3000)
├─ mail-dev.nguyenanhhao.site → dev (5001/3001)
└─ preview-*.mail-dev.nguyenanhhao.site → preview (51xx/31xx)
```

- Each environment runs in isolated Docker containers
- Nginx routes traffic based on domain
- SSL certificates auto-generated for all domains
- Max 2 preview environments (oldest auto-removed)

## 📝 Manual Deployment

```bash
# Production
cd ansible
ansible-playbook -i inventory-prod.ini deploy.yml

# Development
cd ansible
ansible-playbook -i inventory-dev.ini deploy.yml
```

## 🔍 Monitoring

```bash
# Check containers
ssh ubuntu@server "docker ps"

# View logs
ssh ubuntu@server "docker compose -p prod -f /opt/prod/docker-compose.yml logs -f"

# Check Nginx
ssh ubuntu@server "sudo nginx -t && sudo systemctl status nginx"
```

## 📚 Documentation

- [Example Inventories](ansible/) - Configuration templates

## 🆘 Support

Common issues:
1. Check GitHub Secrets are set correctly
2. Verify DNS records point to correct IPs
3. Ensure SSH keys have correct format (no base64 encoding needed)
4. Check Docker and Nginx logs on server
