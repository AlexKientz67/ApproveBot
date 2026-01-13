# 🎬 ApproveBot

Un bot Discord conçu pour simplifier la gestion des requêtes **Jellyseerr**. Il centralise les demandes de films et séries directement dans un salon Discord et permet une validation rapide via des réactions.

![Node.js](https://img.shields.io/badge/node.js-v16.x+-green.svg)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

---

## ✨ Caractéristiques

- **Notification Automatique** : Publie instantanément les nouvelles requêtes en attente
- **Embeds Riches** : Affiche le titre, la description, l'utilisateur, la date et l'affiche du média
- **Validation Interactive** : Utilisez les réactions ✅ et ❌ pour approuver ou refuser une requête
- **Sécurité par Rôle** : Seuls les utilisateurs avec le rôle autorisé peuvent valider
- **Polling Configurable** : Ajustez la fréquence de vérification des nouvelles requêtes

---

## 🚀 Installation

### 🐳 Avec Docker (Recommandé)

#### Avec Docker Compose

Un `docker-compose.yml` est fourni pour un déploiement facile :

**docker-compose.yml**
```yaml
version: '3.8'

services:
  approvebot:
    image: alexk674/approvebot:latest
    container_name: approvebot
    restart: unless-stopped
    environment:
      DISCORD_TOKEN: ${DISCORD_TOKEN}
      JELLYSEERR_URL: ${JELLYSEERR_URL}
      JELLYSEERR_API_KEY: ${JELLYSEERR_API_KEY}
      CHANNEL_ID: ${CHANNEL_ID}
      APPROVER_ROLE_ID: ${APPROVER_ROLE_ID}
      CHECK_INTERVAL: ${CHECK_INTERVAL:-10000}
    networks:
      - jellyseerr-network

networks:
  jellyseerr-network:
    driver: bridge
```

#### Avec Docker

Vous pouvez également lancer l'image directement :

```bash
docker run -d \
  --name approvebot \
  -e DISCORD_TOKEN=votre_token \
  -e JELLYSEERR_URL=https://jellyseerr.example.com \
  -e JELLYSEERR_API_KEY=votre_cle \
  -e CHANNEL_ID=123456789 \
  -e APPROVER_ROLE_ID=987654321 \
  --restart unless-stopped \
  alexk674/approvebot:latest
```

---

### Installation manuelle

#### Prérequis

- [Node.js](https://nodejs.org/) (v16.x ou supérieur)
- Un bot Discord (créé sur le [Discord Developer Portal](https://discord.com/developers/applications))
- Une instance Jellyseerr accessible

#### Étapes

1. **Clonez le dépôt**
```bash
git clone https://github.com/AlexKientz67/ApproveBot.git
cd ApproveBot
npm install
```

2. **Configurez les variables d'environnement**

Créez un fichier `.env` à la racine :

```env
# Configuration Discord
DISCORD_TOKEN=votre_token_discord
CHANNEL_ID=id_du_salon_discord
APPROVER_ROLE_ID=id_du_role_validateur

# Configuration Jellyseerr
JELLYSEERR_URL=https://jellyseerr.votredomaine.com
JELLYSEERR_API_KEY=votre_cle_api

# Paramètres (optionnel)
CHECK_INTERVAL=10000
```

3. **Démarrer le bot**

```bash
npm start
```

Ou directement :

```bash
node index.js
```

#### Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DISCORD_TOKEN` | Token du bot Discord | `MzA0MDI0MjAyNDU2...` |
| `CHANNEL_ID` | ID du salon Discord | `1234567890` |
| `APPROVER_ROLE_ID` | ID du rôle autorisé | `9876543210` |
| `JELLYSEERR_URL` | URL de Jellyseerr | `https://jellyseerr.example.com` |
| `JELLYSEERR_API_KEY` | Clé API Jellyseerr | `abc123def456...` |
| `CHECK_INTERVAL` | Intervalle de vérification (ms) | `10000` |

---

## 🛠️ Utilisation

### Fonctionnalités

- **Vérification Automatique** : Le bot vérifie Jellyseerr toutes les 10 secondes (par défaut)
- **Notifications** : Les nouvelles requêtes sont envoyées dans le salon Discord configué
- **Approbation/Refus** : Réagissez avec ✅ pour approuver ou ❌ pour refuser

---

## 📋 Structure du code

- `index.js` : Point d'entrée principal
- `Dockerfile` : Configuration Docker
- `package.json` : Dépendances Node.js

### Dépendances

- **discord.js** : Intégration Discord
- **axios** : Requêtes HTTP pour l'API Jellyseerr

---

## 🤝 Contribution

Les contributions sont bienvenues ! N'hésitez pas à ouvrir des issues ou pull requests.

---

## 📄 Licence

ISC License
