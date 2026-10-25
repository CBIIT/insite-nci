# Dev Deployment with GitHub Actions (Self-Hosted Runners)

> This README explains how our GitHub Actions–based **dev deploy** works, how runners are selected (including **cbiit-global-runners**), what secrets are required, and a battle-tested workflow template with step-by-step checks. It also includes a network diagram and troubleshooting.

---

## How GitHub selects a runner

- `runs-on:` defines which runners are **eligible** to execute a job.
- For **self-hosted** runners, eligibility is determined by:
  - **Group** (optional): e.g. `cbiit-global-runners`
  - **Labels** (AND-matched): usually `self-hosted`, `Linux`, `X64`, plus any custom label

**Key behavior at CBIIT**  
- If your job asks for labels that only exist on the **cbiit-global-runners** pool, your job will run **there**.  
- If you need a specific machine, give that runner a **unique label** (e.g., `deploy`) and target it.

**Examples**
```yaml
# Use the org pool (any Linux x64 runner there)
runs-on:
  group: cbiit-global-runners
  labels: [self-hosted, Linux, X64]

# Pin to your dedicated runner (must actually have label "deploy")
runs-on: [self-hosted, deploy]

```
> **Note:** `runs-on: ubuntu-latest` = a GitHub-hosted VM on the public internet; it generally **cannot reach internal `10.x.x.x` hosts**.

## Network overview (how the job reaches the server)
```
flowchart LR
  subgraph GH[GitHub.com]
    A[Push to *dev* / manual run]
    B[GitHub Actions Job]
  end

  subgraph CBIIT[CBIIT Network]
    R[self-hosted runner<br/>cbiit-global-runners]
    S[Target server<br/>nci-omero@10.133.109.254]
    K[(authorized_keys<br/>PUBLIC key)]
  end

  subgraph SECRETS[Repo / Environment Secrets]
    SK[DEPLOY_SSH_KEY<br/>(PRIVATE key)]
    HN[NIFE_HOSTNAME / PROD_HOSTNAME]
    DU[DEPLOY_USER]
    DP[DEPLOY_PATH]
  end

  A --> B
  B --> R
  SK --> B
  HN --> B
  DU --> B
  DP --> B

  R -->|SSH (SK)| S
  S --> K

  note right of R
    Runs inside CBIIT network.
    Can reach 10.133.x.x hosts.
  end

  note bottom of S
    Server accepts the job’s key
    only if K contains the
    matching PUBLIC key.
  end
```
> **Note:** If you ever must use  `runs-on: ubuntu-latest`, you’ll need a bastion/VPN to reach internal hosts.

## Required secrets & host preparation

### Environment or repo secrets

| Name            | What it is                                                                 | Example                              |
|-----------------|---------------------------------------------------------------------------|--------------------------------------|
| `DEPLOY_SSH_KEY`| **Private** key (PEM/OpenSSH). Use **RSA-3072**; paste full key incl. BEGIN/END lines. | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |
| `NIFE_HOSTNAME` | Dev host or IP                                                             | `10.133.109.254`                     |
| `PROD_HOSTNAME` | Prod host or IP *(if used)*                                                | *(optional)*                         |
| `DEPLOY_USER`   | SSH user on remote                                                         | `nci-omero`                          |
| `DEPLOY_PATH`   | Absolute deploy path on remote                                             | `/opt/omero/app`                     |

> **Note:** Many enterprise/FIPS hosts reject Ed25519 keys. Prefer **RSA-3072** for `DEPLOY_SSH_KEY`.

## One-time server setup (by Systems or maintainers)
```bash
### 1) Install the **public** key that matches `DEPLOY_SSH_KEY`

ssh-copy-id -i ~/.ssh/omero_ci_rsa.pub nci-omero@10.133.XX.XX

### 2) Add / append the CI public key to authorized_keys of the environmrnt - Git Action deployement engine will look provide omero_ci_rsa private key to access nife or insite remote environment
cat /path/to/omero_ci_rsa.pub >> ~/.ssh/authorized_keys

### 3) Fix permissions (run on the server as `nci-omero`)

chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chown -R "$USER:$USER" ~/.ssh

### 4) Ensure `sshd` allows RSA (common on FIPS systems)

**Verify:**
sudo sshd -T | egrep -i 'pubkeyaccepted|pubkeyauthentication'

### 5) (Optional) Allow passwordless restart of `omero-web`

# /etc/sudoers.d/omero-web (managed by Systems)
nci-omero ALL=(root) NOPASSWD: /bin/systemctl restart omero-web, /bin/systemctl is-active omero-web
```

# Minimal, reliable Dev Deploy workflow
```
name: Deploy (dev)

on:
  workflow_dispatch:
  push:
    branches: ["*dev"]

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true

jobs:
  deploy:
    runs-on:
      group: cbiit-global-runners
      labels: [self-hosted, Linux, X64]

    environment: dev

    env:
      DEPLOY_HOSTNAME: ${{ secrets.NIFE_HOSTNAME }}
      DEPLOY_PATH:     ${{ secrets.DEPLOY_PATH }}

    steps:
      - name: Preflight — required secrets
        run: |
          test -n "${{ secrets.DEPLOY_SSH_KEY }}" || { echo "Missing DEPLOY_SSH_KEY"; exit 1; }
          test -n "${{ secrets.DEPLOY_USER }}"    || { echo "Missing DEPLOY_USER"; exit 1; }
          test -n "${{ env.DEPLOY_HOSTNAME }}"    || { echo "Missing DEPLOY_HOSTNAME"; exit 1; }
          test -n "${{ env.DEPLOY_PATH }}"        || { echo "Missing DEPLOY_PATH"; exit 1; }
          echo "DEPLOY_USER=${{ secrets.DEPLOY_USER }}" >> "$GITHUB_ENV"

      - name: Setup SSH (deploy key + host pin)
        env:
          KEY: ${{ secrets.DEPLOY_SSH_KEY }}
        run: |
          set -euo pipefail
          mkdir -p "$RUNNER_TEMP/ssh"; chmod 700 "$RUNNER_TEMP/ssh"
          printf '%s\n' "$KEY" | tr -d '\r' > "$RUNNER_TEMP/ssh/deploy_key"
          chmod 600 "$RUNNER_TEMP/ssh/deploy_key"
          ssh-keygen -y -f "$RUNNER_TEMP/ssh/deploy_key" >/dev/null
          ssh-keyscan -H "$DEPLOY_HOSTNAME" >> "$RUNNER_TEMP/ssh/known_hosts" 2>/dev/null || true
          chmod 644 "$RUNNER_TEMP/ssh/known_hosts"
          cat > "$RUNNER_TEMP/ssh/config" <<CFG
          Host *
            IdentityFile $RUNNER_TEMP/ssh/deploy_key
            IdentitiesOnly yes
            StrictHostKeyChecking yes
            UserKnownHostsFile $RUNNER_TEMP/ssh/known_hosts
          CFG
          unset SSH_AUTH_SOCK || true

      - name: SSH smoke test
        run: |
          ssh -F "$RUNNER_TEMP/ssh/config" -o IdentitiesOnly=yes -o BatchMode=yes \
            "$DEPLOY_USER@$DEPLOY_HOSTNAME" 'whoami && hostname'

      - name: Checkout
        uses: actions/checkout@v4

      - name: Ensure remote path exists
        run: |
          ssh -F "$RUNNER_TEMP/ssh/config" -o IdentitiesOnly=yes -o BatchMode=yes \
            "$DEPLOY_USER@$DEPLOY_HOSTNAME" "mkdir -p '$DEPLOY_PATH'"

      - name: Rsync deploy
        run: |
          rsync -a --exclude='.git*' \
            -e "ssh -F $RUNNER_TEMP/ssh/config -o IdentitiesOnly=yes -o BatchMode=yes" \
            ./ "$DEPLOY_USER@$DEPLOY_HOSTNAME:$DEPLOY_PATH"

      - name: Install Python packages
        run: |
          ssh -F "$RUNNER_TEMP/ssh/config" -o IdentitiesOnly=yes -o BatchMode=yes \
            "$DEPLOY_USER@$DEPLOY_HOSTNAME" \
            "python3 -m pip install -U pip && python3 -m pip install -e $DEPLOY_PATH/web/apps/*"

      - name: Restart omero-web
        run: |
          ssh -F "$RUNNER_TEMP/ssh/config" -o IdentitiesOnly=yes -o BatchMode=yes \
            "$DEPLOY_USER@$DEPLOY_HOSTNAME" \
            "sudo -n systemctl restart omero-web && systemctl is-active omero-web"

```

> **Note:** For prod, add a prod environment and switch DEPLOY_HOSTNAME to secrets.PROD_HOSTNAME.

## Troubleshooting quick table

| Symptom | Likely cause | Fix |
|---|---|---|
| Job “Waiting for a runner…” | No runner with requested labels/group | Check **Actions → Runners**; adjust `runs-on` labels/group |
| Could not resolve / No route to host | GitHub-hosted runner can’t reach internal host | Use **self-hosted** (`cbiit-global-runners`) or a **bastion/VPN** |
| Permission denied (publickey, …) | Private key doesn’t match any public key on server; or disallowed key type | Ensure `DEPLOY_SSH_KEY` is the **private** key; install **matching public** key; use **RSA-3072** on FIPS hosts |
| Too many authentication failures | Agent offering extra keys | Use `IdentitiesOnly yes`, `-F` config, and `unset SSH_AUTH_SOCK` |
| `rsync` fails but SSH test passes | Remote dir missing / not writable | `mkdir -p "$DEPLOY_PATH"` and ensure permissions/ownership |
| `sudo: a password is required` | NOPASSWD not allowed | Add limited **NOPASSWD** sudoers rule for `systemctl` commands |

## FAQ

**Q: Why did this used to work without SSH keys?**  
**A:** The job previously ran on a **runner installed on the server itself**, so it didn’t need SSH. After moving to **org self-hosted runners**, the job must **SSH into the server**.

**Q: Why not use Ed25519?**  
**A:** Some enterprise / FIPS configurations **reject Ed25519**. **RSA-3072** with **rsa-sha2-256/512** is broadly accepted.

**Q: Can we force a specific runner?**  
**A:** Yes—**label** that runner (e.g., `deploy`) and **require it** in `runs-on`.

# ASCII network fallback

```
Dev push/run
    │
    ▼
GitHub Actions ── uses secrets (DEPLOY_SSH_KEY, NIFE_HOSTNAME, DEPLOY_USER, DEPLOY_PATH)
    │
    ├── GitHub-hosted runner (ubuntu-latest)  ──X── cannot reach 10.133.x.x (internal)
    │
    └── self-hosted runner: cbiit-global-runners ──▶ internal network ──▶ nci-omero (10.133.XX.XX)
                                                           ▲
                                                           │
                                               ~/.ssh/authorized_keys (PUBLIC key must match DEPLOY_SSH_KEY)

```

# Change history (admin note)

2025-09: Moved deploy jobs to cbiit-global-runners. Required adding RSA SSH key and explicit SSH setup in workflow.