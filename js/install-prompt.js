// Installation de l'application (PWA) : capte l'invite native du navigateur
// (« beforeinstallprompt ») pour activer un bouton "Installer" en un clic,
// et affiche sinon les instructions adaptées (iOS, ou déjà installée).
//
// Marquage attendu dans la page :
//   <button data-install-btn data-install-state="ready">Installer…</button>
//   <p data-install-state="unavailable">…instructions manuelles…</p>
//   <p data-install-state="ios">…instructions iOS…</p>
//   <p data-install-state="installed">…déjà installée…</p>
// Un seul bloc [data-install-state] est affiché à la fois ; CSS les cache
// tous par défaut (règle `[data-install-state] { display: none; }`).
(function () {
    let deferredPrompt = null;

    function isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;
    }

    function isIos() {
        return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    }

    function setState(state) {
        document.querySelectorAll('[data-install-state]').forEach((el) => {
            el.style.display = el.getAttribute('data-install-state') === state ? '' : 'none';
        });
    }

    function refreshState() {
        if (isStandalone()) {
            setState('installed');
        } else if (deferredPrompt) {
            setState('ready');
        } else if (isIos()) {
            setState('ios');
        } else {
            setState('unavailable');
        }
    }

    refreshState();

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredPrompt = event;
        refreshState();
    });

    document.querySelectorAll('[data-install-btn]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            btn.disabled = true;
            deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            deferredPrompt = null;
            btn.disabled = false;
            refreshState();
            if (choice.outcome !== 'accepted') {
                // L'utilisateur a refusé : on retombe sur les instructions
                // manuelles plutôt que de rester bloqué sans rien afficher.
                setState('unavailable');
            }
        });
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        setState('installed');
    });
})();
