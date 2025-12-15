# Deployment System Summary

## ✅ What's Been Done

### 1. **New Files Created**

#### Ansible (devops/ansible/)
- ✅ `deploy.yml` - Universal deployment playbook for all environments
- ✅ `inventory-prod.example.ini` - Production inventory template
- ✅ `inventory-dev.example.ini` - Development inventory template
- ✅ `inventory-preview.example.ini` - Preview inventory template
- ✅ `README-NEW-SYSTEM.md` - Complete documentation

#### GitHub Actions (devops/.github/workflows/)
- ✅ `deploy-prod.yml` - Manual production deployment
- ✅ `deploy-dev-new.yml` - Auto development deployment
- ✅ `deploy-preview.yml` - Auto preview deployment
- ✅ `cleanup-preview.yml` - Auto preview cleanup on branch delete

#### Root (devops/)
- ✅ `README.md` - Updated main documentation

### 2. **Updated Files**

#### Backend (user-registration-be/)
- ✅ `.github/workflows/docker-build.yml` - Updated trigger payloads

#### Frontend (user-registration-fe/)
- ✅ `.github/workflows/docker-build.yml` - Updated trigger payloads

### 3. **Deleted Old Files**

#### Ansible
- 🗑️ `playbook.yml` (old)
- 🗑️ `reset-and-deploy.yml` (old)
- 🗑️ `cleanup.yml` (old)
- 🗑️ `setup-traefik.yml` (Traefik not used)
- 🗑️ `inventory-*.ini` (old, kept .example only)
- 🗑️ `README-MULTI-ENV.md` (old docs)

#### Workflows
- 🗑️ `deploy-dev.yml` (old, replaced with deploy-dev-new.yml)
- 🗑️ `destroy-preview.yml` (old, replaced with cleanup-preview.yml)

#### Root Folders
- 🗑️ `scripts/` - All shell scripts removed
- 🗑️ `traefik/` - Traefik configs removed (using Nginx)
- 🗑️ `config/` - Old configs removed
- 🗑️ `docker-compose.dev.yml` (root level)
- 🗑️ `docker-compose.prod.yml` (root level)

---

## 📋 Next Steps to Deploy

### 1. Setup GitHub Secrets

In **devops** repository settings → Secrets and variables → Actions:

```yaml
# Server IPs (can be same or different)
PROD_SERVER_IP: "x.x.x.x"
DEV_SERVER_IP: "x.x.x.x"
PREVIEW_SERVER_IP: "x.x.x.x"

# SSH Keys (raw format, no base64 encoding)
PROD_SSH_KEY: |
  -----BEGIN RSA PRIVATE KEY-----
  ...
  -----END RSA PRIVATE KEY-----
DEV_SSH_KEY: (same as above)
PREVIEW_SSH_KEY: (same as above)

# MongoDB Atlas
PROD_MONGO_URI: "mongodb+srv://..."
DEV_MONGO_URI: "mongodb+srv://..."
PREVIEW_MONGO_URI: "mongodb+srv://..."

# JWT Secrets
JWT_SECRET: "your-32-char-secret"
JWT_REFRESH_SECRET: "your-32-char-refresh-secret"

# Google OAuth
GOOGLE_CLIENT_ID: "xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET: "GOCSPX-xxxxx"

# GitHub Token (for pulling images)
GHCR_TOKEN: "ghp_xxxxx"

# SSL Email (optional, has default)
SSL_EMAIL: "your-email@example.com"
```

### 2. Ensure PAT_TOKEN in Backend/Frontend

In **backend** and **frontend** repositories:
- Add secret `PAT_TOKEN` (Personal Access Token with `repo` scope)
- This allows triggering devops workflows

### 3. Test Deployment

#### Development:
```bash
# Push to dev branch in backend or frontend
git checkout dev
git push origin dev

# Should auto-deploy to: https://mail-dev.nguyenanhhao.site
```

#### Preview:
```bash
# Push to any feature branch
git checkout -b feature/new-feature
git push origin feature/new-feature

# Should auto-deploy to: https://preview-feature-new-feature.mail-dev.nguyenanhhao.site
```

#### Production:
```bash
# Go to GitHub Actions in devops repo
# Actions → Deploy Production → Run workflow
# Select backend/frontend branches → Run

# Will deploy to: https://mail.nguyenanhhao.site
```

### 4. Verify Deployment

```bash
# SSH to server
ssh ubuntu@YOUR_SERVER_IP

# Check running containers
docker ps

# Check logs
docker compose -p dev -f /opt/dev/docker-compose.yml logs -f

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check SSL
sudo certbot certificates
```

---

## 🎯 Key Features

1. **Single Playbook**: `deploy.yml` handles everything
2. **Smart Port Assignment**: Auto assigns ports (prod: 5000/3000, dev: 5001/3001, preview: 51xx/31xx)
3. **Auto Cleanup**: Max 2 previews, removes oldest automatically
4. **SSL Everywhere**: Every environment gets HTTPS
5. **Nginx Routing**: Domain-based routing, no Traefik
6. **MongoDB Atlas**: No local DB management
7. **Zero Shell Scripts**: Pure Ansible + GitHub Actions

---

## 📖 Documentation

- **Complete Guide**: [ansible/README-NEW-SYSTEM.md](ansible/README-NEW-SYSTEM.md)
- **Main README**: [README.md](README.md)
- **Example Inventories**: [ansible/](ansible/)

---

## 🔄 Deployment Flow

```
Developer pushes to branch
    ↓
Backend/Frontend: Build & Push Docker image
    ↓
Backend/Frontend: Trigger devops (repository_dispatch)
    ↓
DevOps: Run appropriate workflow
    ↓
    - Generate inventory from secrets
    - Run ansible-playbook deploy.yml
    ↓
Server:
    - Clone repos
    - Create .env files
    - Pull & start containers
    - Configure Nginx
    - Obtain SSL certificate
    ↓
✅ Live at https://your-domain.com
```

---

## 🆘 Common Issues

### 1. Workflow not triggering
- Check PAT_TOKEN is set in backend/frontend repos
- Verify token has `repo` scope
- Check workflow logs in devops repo

### 2. SSH connection failed
- Verify SSH_KEY format (no base64 encoding)
- Check SERVER_IP is correct
- Ensure port 22 is open

### 3. SSL certificate failed
- Check DNS points to correct IP
- Ensure port 80/443 are open
- Verify domain name is correct

### 4. Containers not starting
- Check Docker logs: `docker compose logs`
- Verify MongoDB URI is correct
- Check if ports are already in use

### 5. Preview not cleaning up
- Branch must be completely deleted (not just closed PR)
- Check cleanup-preview.yml workflow logs
- Manual cleanup: Run cleanup-preview workflow from Actions

---

## ✨ Benefits Over Old System

| Feature | Old System | New System |
|---------|-----------|------------|
| Playbooks | Multiple files | 1 universal file |
| Reverse Proxy | Traefik (complex) | Nginx (simple) |
| Port Management | Manual | Automatic |
| Preview Limit | No limit | Max 2, auto cleanup |
| SSL | Manual/Complex | Auto for all |
| MongoDB | Container | Atlas only |
| Scripts | Many .sh files | Zero scripts |
| Server Flexibility | Fixed setup | Same or different servers |
| Debugging | Complex | Clear structure |

---

**System is ready to use! Follow "Next Steps to Deploy" above.**
