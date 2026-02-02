# Neon Database Setup Guide

> Configuration de la base de données Neon (Serverless PostgreSQL) pour PlanningOS

## 1. Créer un compte Neon

1. Aller sur [neon.tech](https://neon.tech)
2. S'inscrire (gratuit, pas de carte bancaire requise)
3. Créer un nouveau projet

## 2. Créer le projet Neon

```
Nom du projet: planningos
Région: eu-central-1 (Francfort) ou eu-west-1 (Irlande)
PostgreSQL Version: 16
```

## 3. Récupérer la connection string

Une fois le projet créé, vous obtenez une URL de connexion :

```
postgresql://[user]:[password]@[endpoint].neon.tech/[database]?sslmode=require
```

Exemple:
```
postgresql://planningos_owner:AbC123XyZ@ep-cool-river-123456.eu-central-1.aws.neon.tech/planningos?sslmode=require
```

## 4. Configurer les variables d'environnement

### Backend API

Créez/modifiez `packages/api/.env` :

```bash
# Copier le template
cp packages/api/.env.example packages/api/.env

# Éditer avec votre URL Neon
DATABASE_URL=postgresql://[user]:[password]@[endpoint].neon.tech/planningos?sslmode=require
DATABASE_MAX_CONNECTIONS=10

# JWT (générer une clé sécurisée)
JWT_SECRET=$(openssl rand -base64 32)
JWT_ACCESS_EXPIRY=900
JWT_REFRESH_EXPIRY=604800

# Server
HOST=127.0.0.1
PORT=3001

# CORS
CORS_ORIGINS=http://localhost:5173,tauri://localhost

# Logging
RUST_LOG=planningos_api=debug,tower_http=debug,sqlx=warn
```

### Frontend Web

Créez/modifiez `apps/web/.env` :

```bash
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001/ws
VITE_APP_NAME=PlanningOS
```

## 5. Installer les outils SQLx

```bash
# Installer sqlx-cli
cargo install sqlx-cli --no-default-features --features rustls,postgres

# Vérifier l'installation
sqlx --version
```

## 6. Initialiser la base de données

### Option A: Script automatisé

```bash
# Depuis la racine du projet
./scripts/setup-db.sh
```

### Option B: Manuellement

```bash
# 1. Créer la base de données (si nécessaire)
sqlx database create

# 2. Exécuter les migrations
cd packages/api
sqlx migrate run

# 3. Seed les données initiales
cd ../..
psql "$DATABASE_URL" -f packages/db/src/seeds/001_initial_data.sql
```

## 7. Vérifier l'installation

### Via psql

```bash
psql "$DATABASE_URL" -c "
SELECT
  (SELECT COUNT(*) FROM organizations) as orgs,
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM shift_types) as shift_types,
  (SELECT COUNT(*) FROM periods) as periods,
  (SELECT COUNT(*) FROM holidays) as holidays;
"
```

Résultat attendu:
```
 orgs | users | shift_types | periods | holidays
------+-------+-------------+---------+----------
    1 |     5 |          26 |      13 |       10
```

### Via API

```bash
# Démarrer l'API
cd packages/api && cargo run

# Tester le health check
curl http://localhost:3001/health
```

## 8. Utilisateurs de test

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@planningos.local | Admin123! | Admin |
| planner@planningos.local | Planner123! | Planner |
| agent1@planningos.local | Agent123! | Agent |
| agent2@planningos.local | Agent123! | Agent |
| agent3@planningos.local | Agent123! | Agent |

## 9. Interface Neon Console

Neon propose une interface web pour :
- Voir les tables et données
- Exécuter des requêtes SQL
- Monitorer les performances
- Gérer les branches (comme Git pour la DB!)

URL: https://console.neon.tech

## 10. Branches de base de données (Feature de Neon)

Neon permet de créer des "branches" de votre DB, comme Git :

```bash
# Créer une branche pour le développement
neon branches create --name dev --parent main

# La branche a sa propre URL de connexion
# Utile pour tester des migrations sans affecter la prod
```

## Dépannage

### Erreur "SSL required"

Assurez-vous que `?sslmode=require` est dans l'URL.

### Erreur "Connection refused"

1. Vérifiez que l'endpoint Neon est actif (il s'éteint après inactivité)
2. Vérifiez votre IP (Neon peut avoir des restrictions)

### Erreur "Password authentication failed"

1. Vérifiez le mot de passe dans l'URL
2. Régénérez le mot de passe dans la console Neon si nécessaire

### Migrations échouent

```bash
# Reset et réappliquer
sqlx database drop
sqlx database create
sqlx migrate run
```

## Commandes utiles

```bash
# Voir l'état des migrations
sqlx migrate info

# Créer une nouvelle migration
sqlx migrate add [nom_migration]

# Révoquer la dernière migration
sqlx migrate revert

# Préparer les queries pour le build offline
cargo sqlx prepare
```
