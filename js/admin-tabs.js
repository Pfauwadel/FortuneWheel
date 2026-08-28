// Deux comportements d'interface ajoutés par la refonte, sans toucher à
// admin.js : la navigation par onglets, et le pavé numérique du verrou PIN
// (qui pilote le champ #lock-pin-input déjà géré par admin-lock.js).
(function () {
    function initTabs() {
        const nav = document.getElementById('admin-tabs');
        if (!nav) return;
        const tabs = Array.from(nav.querySelectorAll('.tab'));
        const panels = Array.from(document.querySelectorAll('.tab-panel'));

        function activate(name) {
            tabs.forEach((tab) => tab.classList.toggle('is-active', tab.dataset.tabTarget === name));
            // Les panneaux inactifs restent dans le DOM : admin.js lit tous
            // les champs au moment de l'enregistrement, y compris cachés.
            panels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.tab === name));
            try { sessionStorage.setItem('fortuneWheelAdminTab', name); } catch (err) { /* ignoré */ }
        }

        tabs.forEach((tab) => tab.addEventListener('click', () => activate(tab.dataset.tabTarget)));

        let saved = null;
        try { saved = sessionStorage.getItem('fortuneWheelAdminTab'); } catch (err) { saved = null; }
        if (saved && tabs.some((tab) => tab.dataset.tabTarget === saved)) activate(saved);
    }

    function initKeypad() {
        const keypad = document.getElementById('lock-keypad');
        const input = document.getElementById('lock-pin-input');
        const submit = document.getElementById('lock-submit');
        if (!keypad || !input) return;

        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].forEach((key) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'key';
            button.textContent = key;
            button.addEventListener('click', () => {
                if (key === '⌫') {
                    input.value = input.value.slice(0, -1);
                } else if (key === '✓') {
                    if (submit) submit.click();
                } else if (input.value.length < Number(input.maxLength || 12)) {
                    input.value += key;
                }
                input.focus();
            });
            keypad.appendChild(button);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initTabs();
        initKeypad();
    });
})();
