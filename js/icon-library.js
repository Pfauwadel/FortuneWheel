// Bibliothèque de goodies générique (icônes vectorielles inline, style trait
// uniforme). Remplace les photos PNG spécifiques : chaque icône est un
// simple pictogramme, recolorable (currentColor) et net à toute taille,
// donc adapté à n'importe quel salon / événement.
(function () {
    const STROKE = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';

    const ICONS = [
        {
            id: 'cup', label: 'Tasse / Mug',
            body: `<path ${STROKE} d="M4.5 8h11v7a4 4 0 0 1-4 4H8.5a4 4 0 0 1-4-4V8z"/><path ${STROKE} d="M15.5 9.2h2a2.3 2.3 0 0 1 0 4.6h-2"/>`
        },
        {
            id: 'keychain', label: 'Porte-clés',
            body: `<circle ${STROKE} cx="7" cy="7" r="3.1"/><path ${STROKE} d="M9.2 9.2 15.5 15.5"/><rect ${STROKE} x="15.4" y="15.4" width="5.2" height="5.2" rx="1.1" transform="rotate(45 18 18)"/>`
        },
        {
            id: 'pen', label: 'Stylo',
            body: `<path ${STROKE} d="M4 20l1-4.2L15.8 5 19 8.2 8.2 19 4 20z"/><path ${STROKE} d="M14 6.2 17.8 10"/>`
        },
        {
            id: 'tshirt', label: 'T-shirt',
            body: `<path ${STROKE} d="M8.3 4.2 4.2 7.3l2 3 1.8-1v10.9h7.9V9.3l1.8 1 2-3-4.1-3.1-2 2H10.4l-2.1-2z"/>`
        },
        {
            id: 'cap', label: 'Casquette',
            body: `<path ${STROKE} d="M4 15a8 6 0 0 1 16 0"/><path ${STROKE} d="M4 15h12.5c2.4 0 4-.6 5.2-1.7"/><path ${STROKE} d="M12 9V6.2"/>`
        },
        {
            id: 'totebag', label: 'Sac tote',
            body: `<path ${STROKE} d="M6.3 9h11.4l1 11.2H5.3L6.3 9z"/><path ${STROKE} d="M9.2 9V7.2a2.8 2.8 0 0 1 5.6 0V9"/>`
        },
        {
            id: 'usb', label: 'Clé USB',
            body: `<rect ${STROKE} x="4" y="9.2" width="7" height="5.6" rx="1"/><path ${STROKE} d="M11 12h6.5"/><rect ${STROKE} x="17.3" y="10" width="2.7" height="1.5"/><rect ${STROKE} x="17.3" y="12.5" width="2.7" height="1.5"/>`
        },
        {
            id: 'notebook', label: 'Carnet',
            body: `<rect ${STROKE} x="5" y="4" width="14" height="16" rx="1.4"/><path ${STROKE} d="M8.3 4v16"/><path ${STROKE} d="M11.5 8h4M11.5 11.3h4M11.5 14.6h2.6"/>`
        },
        {
            id: 'badge', label: 'Badge / Pin\'s',
            body: `<circle ${STROKE} cx="12" cy="10" r="5.6"/><path ${STROKE} d="M9 15 8 21l4-2.2L16 21l-1-6"/>`
        },
        {
            id: 'candy', label: 'Confiserie',
            body: `<circle ${STROKE} cx="12" cy="12" r="3.6"/><path ${STROKE} d="M4.3 8l4 2.5v3l-4 2.5"/><path ${STROKE} d="M19.7 8l-4 2.5v3l4 2.5"/>`
        },
        {
            id: 'trophy', label: 'Trophée',
            body: `<path ${STROKE} d="M7.2 4.2h9.6v4a4.8 4.8 0 0 1-9.6 0v-4z"/><path ${STROKE} d="M5.2 5.2H3.4v1.8a3.8 3.8 0 0 0 3.8 3.8"/><path ${STROKE} d="M18.8 5.2h1.8v1.8a3.8 3.8 0 0 1-3.8 3.8"/><path ${STROKE} d="M12 12.8v3.6"/><path ${STROKE} d="M9 19.8h6"/><path ${STROKE} d="M9.3 19.8 10.2 17h3.6l.9 2.8"/>`
        },
        {
            id: 'ticket', label: 'Bon / Ticket',
            body: `<path ${STROKE} d="M4.3 8.3a1.8 1.8 0 0 1 1.8-1.8h11.8a1.8 1.8 0 0 1 1.8 1.8v1.8a1.8 1.8 0 0 0 0 3.6v1.8a1.8 1.8 0 0 1-1.8 1.8H6.1a1.8 1.8 0 0 1-1.8-1.8v-1.8a1.8 1.8 0 0 0 0-3.6V8.3z"/><path ${STROKE} d="M13.5 6.5v11" stroke-dasharray="1.6 1.8"/>`
        },
        {
            id: 'star', label: 'Étoile',
            body: `<path ${STROKE} d="M12 3.4l2.4 5.3 5.7.6-4.3 3.8 1.2 5.6L12 15.8l-5 2.9 1.2-5.6L3.9 9.3l5.7-.6L12 3.4z"/>`
        },
        {
            id: 'balloon', label: 'Ballon',
            body: `<path ${STROKE} d="M12 3.4a5.8 5.8 0 0 1 5.8 5.8c0 3.8-2.9 6.2-4.3 8.1a1.5 1.5 0 0 1-3 0c-1.4-1.9-4.3-4.3-4.3-8.1A5.8 5.8 0 0 1 12 3.4z"/><path ${STROKE} d="M12 17.3v3.3"/><path ${STROKE} d="M10.5 20.6h3"/>`
        },
        {
            id: 'mystery', label: 'Cadeau mystère',
            body: `<circle ${STROKE} cx="12" cy="12" r="8.8"/><path ${STROKE} d="M9.4 9.6a2.6 2.6 0 1 1 3.7 2.4c-.9.4-1.1 1-1.1 1.8"/><circle cx="12" cy="16.9" r="0.9" fill="currentColor" stroke="none"/>`
        }
    ];

    const byId = {};
    ICONS.forEach((icon) => { byId[icon.id] = icon; });

    function get(iconId) {
        return byId[iconId] || byId.mystery;
    }

    // Rend une icône en balisage SVG autonome (chaîne), prête à insérer.
    function renderSVG(iconId, { size = 32, color } = {}) {
        const icon = get(iconId);
        const style = color ? ` style="color:${color}"` : '';
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"${style} aria-hidden="true">${icon.body}</svg>`;
    }

    window.IconLibrary = {
        list: ICONS,
        get,
        renderSVG
    };
})();
