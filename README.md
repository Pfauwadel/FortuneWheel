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
| `guide.html` | Guide & documentation : installation hors-ligne, tutoriel, FAQ |
| `config.json` | Configuration par défaut, servie à tout le monde |
| `js/config-store.js` | Chargement/sauvegarde de la config (config.json + surcharge localStorage) |
| `js/icon-library.js` | Bibliothèque d'icônes de goodies (SVG inline) |
| `js/theme-library.js` | Thèmes de couleurs prédéfinis + générateur de palette |
| `js/wheel.js` | Génération, animation et tirage de la roue |
| `js/admin.js` | Logique de l'interface d'administration |
| `js/admin-lock.js` | Verrou PIN local de l'administration |
| `js/sound.js` | Effets sonores synthétisés (Web Audio) |
| `js/install-prompt.js` | Capte l'invite d'installation PWA pour le bouton « Installer » |
| `manifest.json`, `sw.js` | PWA (installation hors-ligne) |
| `assets/` | Icônes de l'application (PWA) |

## Fonctionnalités

- **Thèmes** : 10 palettes prédéfinies + génération automatique d'une palette harmonieuse à partir d'une seule couleur de marque.
- **Gestion de stock** : chaque lot peut avoir un stock initial optionnel (vide = illimité), décrémenté automatiquement à chaque gain, avec réinitialisation en un clic entre deux journées d'évènement.
- **Animations** : confettis à la victoire, sons synthétisés (lancement/tick/victoire), mode attraction (pulsation après inactivité), toutes désactivables dans les réglages.
- **Verrou PIN** : protège l'accès à `admin.html` sur un poste partagé. Stocké uniquement en local (jamais dans `config.json`/l'export) — ce n'est pas un mécanisme de sécurité fort ; un PIN oublié se contourne en vidant les données du site dans le navigateur.

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
   « Installer l'application »), ou utiliser le bouton « Installer »
   proposé sur la page d'accueil / le guide.
3. L'application s'ouvre ensuite comme un programme local et fonctionne sans
   connexion internet.

Voir `guide.html` pour le détail par navigateur (Chrome, Edge, Android,
Safari iOS) et une documentation complète du fonctionnement de l'application.

## Développement local

Un service worker ne fonctionne pas en `file://`. Pour tester en local,
servir le dossier via un petit serveur HTTP, par exemple :

```
npx serve .
```

puis ouvrir l'URL affichée dans le navigateur.
