# PlanningOS - Git Initialization Guide

> **Version**: 1.0.0
> **Last Updated**: 2026-02-02

---

## Table of Contents

1. [Repository Setup](#repository-setup)
2. [Branch Strategy](#branch-strategy)
3. [Commit Conventions](#commit-conventions)
4. [Git Hooks](#git-hooks)
5. [Code Review Process](#code-review-process)

---

## Repository Setup

### Initial Clone

```bash
# Clone the repository
git clone https://github.com/fs0ciety7000/PlanningOs.git
cd PlanningOs

# Verify remote
git remote -v
# origin  https://github.com/fs0ciety7000/PlanningOs.git (fetch)
# origin  https://github.com/fs0ciety7000/PlanningOs.git (push)
```

### Configure Git Identity

```bash
# Set your identity (required for commits)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Optional: Use different identity for this repo only
git config --local user.name "Your Name"
git config --local user.email "your.work.email@company.com"
```

### Configure Line Endings

```bash
# Windows
git config --global core.autocrlf true

# macOS/Linux
git config --global core.autocrlf input
```

### .gitignore

The repository includes a comprehensive `.gitignore`:

```gitignore
# Dependencies
node_modules/
target/
.pnpm-store/

# Build outputs
dist/
build/
*.exe
*.dll
*.so
*.dylib

# IDE
.idea/
.vscode/
*.swp
*.swo
.DS_Store

# Environment
.env
.env.local
.env.*.local
*.env

# Logs
logs/
*.log
npm-debug.log*
pnpm-debug.log*

# Test coverage
coverage/
.nyc_output/

# Database
*.sqlite
*.db

# Tauri
src-tauri/target/
src-tauri/WixTools/
src-tauri/Cargo.lock

# Generated
*.generated.*
sqlx-data.json.bak

# OS
Thumbs.db
.DS_Store

# Secrets (NEVER commit these)
*.pem
*.key
credentials.json
service-account.json
```

---

## Branch Strategy

We follow a simplified **Git Flow** model:

```
main (production)
│
├── develop (integration)
│   │
│   ├── feature/xxx
│   ├── feature/yyy
│   │
│   └── release/x.x.x
│
└── hotfix/xxx (emergency fixes)
```

### Branch Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<ticket>-<description>` | `feature/PLN-42-planning-matrix` |
| Bugfix | `bugfix/<ticket>-<description>` | `bugfix/PLN-99-quota-calculation` |
| Hotfix | `hotfix/<ticket>-<description>` | `hotfix/PLN-100-login-crash` |
| Release | `release/<version>` | `release/1.2.0` |
| Chore | `chore/<description>` | `chore/update-dependencies` |

### Branch Lifecycle

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/PLN-42-planning-matrix

# 2. Work on feature
git add .
git commit -m "feat(planning): add matrix virtualization"

# 3. Keep branch updated
git fetch origin develop
git rebase origin/develop

# 4. Push feature branch
git push -u origin feature/PLN-42-planning-matrix

# 5. Create Pull Request to develop

# 6. After merge, delete local branch
git checkout develop
git pull origin develop
git branch -d feature/PLN-42-planning-matrix
```

---

## Commit Conventions

We use **Conventional Commits** specification.

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add JWT refresh token` |
| `fix` | Bug fix | `fix(planning): correct night hours calculation` |
| `docs` | Documentation | `docs(api): update OpenAPI spec` |
| `style` | Code style (no logic change) | `style(ui): format with prettier` |
| `refactor` | Code refactoring | `refactor(domain): extract quota validator` |
| `perf` | Performance improvement | `perf(matrix): virtualize schedule grid` |
| `test` | Add/update tests | `test(quota): add edge case coverage` |
| `build` | Build system changes | `build(deps): upgrade to React 19` |
| `ci` | CI/CD changes | `ci(github): add e2e workflow` |
| `chore` | Maintenance tasks | `chore(deps): update lockfile` |
| `revert` | Revert previous commit | `revert: feat(auth): add JWT refresh token` |

### Scopes

| Scope | Area |
|-------|------|
| `api` | Backend API |
| `web` | Web frontend |
| `desktop` | Tauri desktop app |
| `db` | Database migrations/schema |
| `auth` | Authentication |
| `planning` | Planning/scheduling module |
| `admin` | Admin module |
| `ui` | UI components |
| `domain` | Business logic |
| `infra` | Infrastructure |

### Examples

```bash
# Feature
git commit -m "feat(planning): implement drag-and-drop shift assignment

- Add DnD context provider
- Create draggable shift component
- Update schedule store with optimistic updates

Closes #42"

# Bug fix
git commit -m "fix(domain): correct period boundary calculation

The period end date was off by one day due to incorrect
duration calculation.

Fixes #99"

# Breaking change
git commit -m "feat(api)!: change schedule endpoint response format

BREAKING CHANGE: The /api/v1/schedules endpoint now returns
a nested structure instead of flat array.

Migration guide in docs/migrations/v2-schedules.md"
```

---

## Git Hooks

We use **Husky** for Git hooks and **lint-staged** for pre-commit checks.

### Installation

```bash
# Install dependencies
pnpm install

# Husky is automatically set up via prepare script
```

### Hook Configuration

#### `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged
pnpm lint-staged

# Run Rust checks (if Rust files changed)
if git diff --cached --name-only | grep -q "\.rs$"; then
  echo "Running Rust checks..."
  cd packages/api && cargo fmt --check && cargo clippy -- -D warnings
fi
```

#### `.husky/commit-msg`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validate commit message format
pnpm commitlint --edit $1
```

#### `.husky/pre-push`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run tests before push
pnpm test:ci
```

### lint-staged Configuration

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ],
    "*.rs": [
      "rustfmt"
    ],
    "*.sql": [
      "sql-formatter --fix"
    ]
  }
}
```

### commitlint Configuration

```js
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'api',
        'web',
        'desktop',
        'db',
        'auth',
        'planning',
        'admin',
        'ui',
        'domain',
        'infra',
        'deps',
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
  },
};
```

---

## Code Review Process

### Pull Request Template

```markdown
<!-- .github/PULL_REQUEST_TEMPLATE.md -->

## Description

<!-- Describe your changes -->

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)

## Related Issues

<!-- Link to related issues -->
Closes #

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots (if applicable)

<!-- Add screenshots for UI changes -->
```

### Review Guidelines

1. **Automated Checks Must Pass**
   - CI pipeline (build, lint, test)
   - Code coverage threshold (80%)
   - Security scanning

2. **Required Approvals**
   - 1 approval for bug fixes
   - 2 approvals for features
   - Team lead approval for breaking changes

3. **Review Focus Areas**
   - Business logic correctness
   - Security implications
   - Performance impact
   - Test coverage
   - Code readability

### Merge Strategy

- **Feature branches**: Squash and merge
- **Release branches**: Merge commit
- **Hotfixes**: Merge commit (to preserve history)

```bash
# Squash merge (features)
git merge --squash feature/PLN-42-planning-matrix

# Regular merge (releases/hotfixes)
git merge --no-ff release/1.2.0
```

---

## Git Aliases (Recommended)

Add these to your `~/.gitconfig`:

```ini
[alias]
    # Status
    st = status -sb

    # Branching
    co = checkout
    cob = checkout -b
    br = branch -v

    # Commits
    cm = commit -m
    amend = commit --amend --no-edit

    # Logging
    lg = log --oneline --graph --decorate -20
    hist = log --pretty=format:'%C(yellow)%h%Creset %ad | %C(green)%s%Creset %C(red)%d%Creset %C(blue)[%an]' --date=short

    # Diff
    df = diff --stat
    dfc = diff --cached

    # Reset
    unstage = reset HEAD --
    undo = reset --soft HEAD~1

    # Clean
    cleanup = "!git branch --merged | grep -v '\\*\\|main\\|develop' | xargs -n 1 git branch -d"

    # Sync
    sync = "!git fetch origin && git rebase origin/$(git branch --show-current)"
```

---

## Troubleshooting

### Common Issues

**Hook not running:**
```bash
# Reinstall Husky hooks
pnpm husky install
chmod +x .husky/*
```

**Commit rejected by commitlint:**
```bash
# Check your message format
echo "feat(api): add endpoint" | pnpm commitlint

# Fix and retry
git commit --amend -m "feat(api): add user endpoint"
```

**Merge conflicts:**
```bash
# Abort and restart
git merge --abort

# Or resolve manually
git add <resolved-files>
git merge --continue
```

**Rebase conflicts:**
```bash
# Continue after resolving
git add <resolved-files>
git rebase --continue

# Or abort
git rebase --abort
```

---

*Document maintained by the PlanningOS development team.*
