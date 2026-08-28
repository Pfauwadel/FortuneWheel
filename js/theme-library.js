// Thèmes de couleurs prédéfinis, harmonisés (palette de segments + couleur
// d'accent pour le bouton / pointeur / titre / décor). Un thème "custom"
// permet de garder le réglage manuel couleur par couleur, ou une palette
// générée automatiquement à partir d'une seule couleur de marque.
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
        },
        {
            id: 'corporate-blue',
            label: 'Corporate Bleu',
            colors: ['#12395c', '#1f5a85', '#4d7ea8', '#c9d6e0', '#0a2033', '#7d97ab'],
            accentColor: '#1f5a85'
        },
        {
            id: 'neon',
            label: 'Festif / Néon',
            colors: ['#ff2d95', '#00e5ff', '#ffe500', '#7b2ff7', '#120024', '#ff6ec7'],
            accentColor: '#ff2d95'
        },
        {
            id: 'pastel',
            label: 'Pastel',
            colors: ['#ffd1dc', '#c1e7e3', '#fff3b0', '#d9c8f0', '#4a4a4a', '#ffe0ac'],
            accentColor: '#c96a95'
        },
        {
            id: 'autumn',
            label: 'Automne',
            colors: ['#b5541c', '#d98324', '#8a3324', '#e8b04b', '#4a2c1d', '#c97c3d'],
            accentColor: '#b5541c'
        },
        {
            id: 'winter',
            label: 'Hiver',
            colors: ['#3b6e8f', '#a9c9d6', '#e8f1f5', '#1d3b4a', '#5f8aa3', '#c3dce6'],
            accentColor: '#3b6e8f'
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

    // --- Conversion hex <-> HSL, pour générer une palette harmonieuse à
    // partir d'une seule couleur de marque (rotations de teinte/luminosité).
    function hexToHsl(hex) {
        const num = parseInt(hex.replace('#', ''), 16);
        let r = ((num >> 16) & 0xff) / 255;
        let g = ((num >> 8) & 0xff) / 255;
        let b = (num & 0xff) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                default: h = (r - g) / d + 4;
            }
            h *= 60;
        }
        return { h, s, l };
    }

    function hslToHex(h, s, l) {
        h = ((h % 360) + 360) % 360;
        s = Math.min(1, Math.max(0, s));
        l = Math.min(1, Math.max(0, l));
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r, g, b;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
        return '#' + toHex(r) + toHex(g) + toHex(b);
    }

    // Génère une palette de 6 couleurs harmonieuses à partir d'une couleur
    // de marque : la couleur elle-même, ses variantes plus sombre/claire, sa
    // complémentaire, et deux neutres (sombre/clair) teintés de la même
    // teinte pour rester cohérent.
    function generateFromBase(baseHex) {
        const { h, s, l } = hexToHsl(baseHex);
        const colors = [
            baseHex,
            hslToHex(h, Math.max(0.15, s * 0.9), Math.max(0.12, l * 0.55)),
            hslToHex(h, Math.max(0.1, s * 0.6), Math.min(0.85, l * 1.5 + 0.1)),
            hslToHex(h + 180, Math.max(0.35, s), Math.min(0.7, Math.max(0.35, l))),
            hslToHex(h, Math.min(0.25, s * 0.3), 0.14),
            hslToHex(h, Math.min(0.2, s * 0.25), 0.92)
        ];
        return { colors, accentColor: baseHex };
    }

    window.ThemeLibrary = {
        list: THEMES,
        get: (id) => byId[id],
        resolve,
        generateFromBase
    };
})();
