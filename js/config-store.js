// Gestion de la configuration de la roue.
//
// Deux niveaux :
// - config.json (commité dans le dépôt) = configuration par défaut, identique
//   pour tout le monde tant qu'aucune modification locale n'a été faite.
// - localStorage = surcharge propre à ce poste, écrite depuis admin.html.
//   Elle permet à la roue de fonctionner et de rester personnalisée hors-ligne
//   une fois l'application installée, sans dépendre d'un serveur.
(function () {
    const STORAGE_KEY = 'fortuneWheelConfig';
    const CONFIG_URL = 'config.json';

    const FALLBACK_CONFIG = {
        settings: {
            title: 'Roue de la Fortune',
            spinMinTurns: 5,
            spinMaxTurns: 10,
            resultDisplayMs: 3000,
            themeId: 'kuhn',
            confettiEnabled: true,
            soundEnabled: true,
            attractModeEnabled: true,
            attractIdleSeconds: 45
        },
        segments: [
            { id: 'seg-1', description: 'Stylo', iconId: 'pen', weight: 100, initialStock: null, stock: null },
            { id: 'seg-2', description: 'Tasse / Mug', iconId: 'cup', weight: 100, initialStock: null, stock: null },
            { id: 'seg-3', description: 'Porte-clés', iconId: 'keychain', weight: 100, initialStock: null, stock: null },
            { id: 'seg-4', description: 'Cadeau mystère', iconId: 'mystery', weight: 100, initialStock: null, stock: null }
        ]
    };

    // Anciennes configs (avant la bascule vers les icônes vectorielles) qui
    // référençaient encore les PNG livrés par défaut : on les fait pointer
    // vers l'icône équivalente pour ne pas casser un poste déjà configuré.
    const LEGACY_IMAGE_TO_ICON = {
        'assets/stylo.png': 'pen',
        'assets/cup.png': 'cup',
        'assets/portecle.png': 'keychain',
        'assets/questionmark.png': 'mystery'
    };

    function cloneConfig(config) {
        return JSON.parse(JSON.stringify(config));
    }

    function normalizeConfig(config) {
        const normalized = cloneConfig(FALLBACK_CONFIG);
        if (config && config.settings) {
            Object.assign(normalized.settings, config.settings);
        }
        if (config && Array.isArray(config.segments) && config.segments.length > 0) {
            normalized.segments = config.segments.map((seg, index) => {
                let iconId = seg.iconId || '';
                let imageUrl = seg.imageUrl || '';
                if (!iconId && imageUrl && LEGACY_IMAGE_TO_ICON[imageUrl]) {
                    iconId = LEGACY_IMAGE_TO_ICON[imageUrl];
                    imageUrl = '';
                }
                if (!iconId && !imageUrl) {
                    iconId = 'mystery';
                }

                const initialStock = (seg.initialStock === null || seg.initialStock === undefined || seg.initialStock === '')
                    ? null
                    : Math.max(0, Number(seg.initialStock));
                // Le stock "restant" évolue au fil des tirages (persisté par
                // recordWin) ; s'il n'a jamais été initialisé, il démarre au
                // stock initial défini par l'admin.
                const stock = (seg.stock === null || seg.stock === undefined || seg.stock === '')
                    ? initialStock
                    : Math.max(0, Number(seg.stock));

                return {
                    id: seg.id || `seg-${index + 1}`,
                    description: seg.description || '',
                    iconId,
                    imageUrl,
                    weight: Number(seg.weight) > 0 ? Number(seg.weight) : 1,
                    initialStock,
                    stock
                };
            });
        }
        return normalized;
    }

    async function fetchDefaultConfig() {
        try {
            const response = await fetch(CONFIG_URL, { cache: 'no-cache' });
            if (!response.ok) throw new Error('config.json introuvable (HTTP ' + response.status + ')');
            return normalizeConfig(await response.json());
        } catch (err) {
            console.warn('[ConfigStore] Impossible de charger config.json, utilisation de la config intégrée.', err);
            return cloneConfig(FALLBACK_CONFIG);
        }
    }

    function readLocalOverride() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? normalizeConfig(JSON.parse(raw)) : null;
        } catch (err) {
            console.warn('[ConfigStore] Configuration locale invalide, ignorée.', err);
            return null;
        }
    }

    function hasLocalOverride() {
        return localStorage.getItem(STORAGE_KEY) !== null;
    }

    async function loadConfig() {
        const override = readLocalOverride();
        if (override) return override;
        return fetchDefaultConfig();
    }

    function saveConfig(config) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeConfig(config)));
    }

    function clearLocalOverride() {
        localStorage.removeItem(STORAGE_KEY);
    }

    // Remet le stock restant de chaque lot à son stock initial (utile entre
    // deux journées de salon, sans avoir à ressaisir les quantités).
    function resetStocks(config) {
        config.segments.forEach((seg) => {
            seg.stock = seg.initialStock;
        });
        return config;
    }

    function exportConfigFile(config) {
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'config.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function importConfigFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const parsed = JSON.parse(reader.result);
                    if (!parsed.segments || !Array.isArray(parsed.segments)) {
                        throw new Error('Fichier invalide : le champ "segments" est manquant.');
                    }
                    resolve(normalizeConfig(parsed));
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    // Redimensionne et encode une image uploadée en data URL, pour que la
    // configuration (localStorage + export JSON) reste compacte.
    function resizeImageFile(file, maxSize = 400) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    let { width, height } = img;
                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = Math.round(height * (maxSize / width));
                            width = maxSize;
                        } else {
                            width = Math.round(width * (maxSize / height));
                            height = maxSize;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = () => reject(new Error('Image illisible.'));
                img.src = reader.result;
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    window.ConfigStore = {
        FALLBACK_CONFIG,
        STORAGE_KEY,
        loadConfig,
        saveConfig,
        clearLocalOverride,
        resetStocks,
        hasLocalOverride,
        exportConfigFile,
        importConfigFile,
        resizeImageFile,
        normalizeConfig,
        cloneConfig
    };
})();
