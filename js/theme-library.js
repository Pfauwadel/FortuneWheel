// Thèmes de couleurs prédéfinis, harmonisés (palette de segments + couleur
// d'accent pour le bouton / pointeur / titre). Un thème "custom" permet de
// garder le réglage manuel couleur par couleur.
(function () {
    const THEMES = [
        {
            id: 'kuhn',
            label: 'Kuhn',
            colors: ['#ee3126', '#4a4a4a', '#d0b580', '#2e3440', '#eeece0', '#8a8a8a'],
            accentColor: '#ee3126'
        },
        {
            id: 'ocean',
            label: 'Océan',
            colors: ['#0f6e8c', '#123a4d', '#3fb6c9', '#7fd4e0', '#0a2230', '#bfe9ee'],
            accentColor: '#0f6e8c'
        },
        {
            id: 'forest',
            label: 'Forêt',
            colors: ['#2e5d34', '#1b3a20', '#7ba05b', '#3e2f1c', '#a9c99a', '#5c7a45'],
            accentColor: '#2e5d34'
        },
        {
            id: 'sunset',
            label: 'Coucher de soleil',
            colors: ['#f4623a', '#ffb347', '#c94277', '#5b2a5e', '#2c1338', '#ff8c69'],
            accentColor: '#f4623a'
        },
        {
            id: 'monochrome',
            label: 'Monochrome élégant',
            colors: ['#1a1a1a', '#3d3d3d', '#6e6e6e', '#a8a8a8', '#c9a24b', '#2a2a2a'],
            accentColor: '#c9a24b'
        }
    ];

    const byId = {};
    THEMES.forEach((theme) => { byId[theme.id] = theme; });

    // Résout la palette effective à utiliser pour l'affichage : un thème
    // prédéfini (les couleurs viennent de la bibliothèque, pas de la config,
    // pour pouvoir les faire évoluer sans casser les configs existantes),
    // ou le thème "custom" qui garde les couleurs stockées dans settings.
    function resolve(settings) {
        const themeId = settings.themeId || 'kuhn';
        if (themeId !== 'custom' && byId[themeId]) {
            return { colors: byId[themeId].colors.slice(), accentColor: byId[themeId].accentColor };
        }
        return {
            colors: (settings.colors && settings.colors.length ? settings.colors : byId.kuhn.colors).slice(),
            accentColor: settings.accentColor || byId.kuhn.accentColor
        };
    }

    window.ThemeLibrary = {
        list: THEMES,
        get: (id) => byId[id],
        resolve
    };
})();
