# Image officielle Node.js (LTS)
FROM node:20-alpine

# Dossier de travail dans le conteneur
WORKDIR /app

# Copier uniquement les fichiers nécessaires aux dépendances
COPY package.json package-lock.json* ./

# Installer les dépendances
RUN npm install

# Copier le reste du projet
COPY . .

# Créer le dossier uploads (sécurité)
RUN mkdir -p uploads

# Exposer le port utilisé par Express
EXPOSE 3020

# Lancer le serveur sans build
# Adapter si tu utilises ts-node ou tsx
CMD ["npm", "run", "dev"]
