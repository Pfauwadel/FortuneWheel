# Roue de la Fortune

Application 100% statique (HTML/CSS/JS, sans backend) : une roue de la
fortune personnalisable, avec une interface d'administration, installable
hors-ligne (PWA) sur un poste.

## Site en ligne

Publié via GitHub Pages : voir l'onglet **About** du dépôt pour le lien, ou
`Settings → Pages` une fois activé.

## Fichiers

| Fichier / dossier | Rôle |
|---|---|
| `index.html` | Page de présentation (landing) |
| `wheel.html` | La roue (application publique, PWA installable) |
| `admin.html` | Administration : segments, images, couleurs, réglages |
| `config.json` | Configuration par défaut, servie à tout le monde |
| `js/config-store.js` | Chargement/sauvegarde de la config (config.json + surcharge localStorage) |
| `js/wheel.js` | Génération et animation de la roue |
| `js/admin.js` | Logique de l'interface d'administration |
| `manifest.json`, `sw.js` | PWA (installation hors-ligne) |
| `assets/` | Images par défaut + icônes de l'application |

## Modèle de configuration

- `config.json`, commité dans le dépôt, est la configuration par défaut vue
  par tout le monde qui ouvre le site.
- Toute modification faite dans `admin.html` est enregistrée dans le
  `localStorage` du poste utilisé : elle surcharge `config.json` **sur cet
  appareil uniquement**, et reste disponible hors-ligne après installation.
- Pour changer la configuration par défaut pour tout le monde : dans
  `admin.html`, cliquer sur **Exporter**, puis remplacer `config.json` dans
  le dépôt (commit + push).

## Installer l'application hors-ligne sur un poste

1. Ouvrir `wheel.html` (ou la page d'accueil) avec Chrome ou Edge, en ligne,
   au moins une fois.
2. Cliquer sur l'icône d'installation dans la barre d'adresse (ou menu ⋮ →
   « Installer l'application »).
3. L'application s'ouvre ensuite comme un programme local et fonctionne sans
   connexion internet.

## Développement local

Un service worker ne fonctionne pas en `file://`. Pour tester en local,
servir le dossier via un petit serveur HTTP, par exemple :

```
npx serve .
```

puis ouvrir l'URL affichée dans le navigateur.
