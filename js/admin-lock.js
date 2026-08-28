// Verrou PIN léger sur l'administration : empêche un visiteur de salon
// d'ouvrir l'admin par curiosité. Ce n'est PAS un mécanisme de sécurité
// fort — le PIN (haché) est stocké uniquement en localStorage sur ce
// poste, jamais dans config.json / l'export (qui finit sur GitHub public).
// Un PIN oublié se contourne en vidant les données du site dans le
// navigateur : c'est un frein, pas un coffre-fort.
(function () {
    const PIN_HASH_KEY = 'fortuneWheelAdminPinHash';
    const SESSION_KEY = 'fortuneWheelAdminUnlocked';

    async function sha256(text) {
        const data = new TextEncoder().encode(text);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    function getStoredHash() {
        return localStorage.getItem(PIN_HASH_KEY);
    }

    function hasPin() {
        return !!getStoredHash();
    }

    async function setPin(pin) {
        localStorage.setItem(PIN_HASH_KEY, await sha256(pin));
        sessionStorage.setItem(SESSION_KEY, '1');
    }

    function removePin() {
        localStorage.removeItem(PIN_HASH_KEY);
        sessionStorage.removeItem(SESSION_KEY);
    }

    async function verifyPin(pin) {
        const hash = await sha256(pin);
        return hash === getStoredHash();
    }

    function isUnlocked() {
        return sessionStorage.getItem(SESSION_KEY) === '1';
    }

    function unlockSession() {
        sessionStorage.setItem(SESSION_KEY, '1');
    }

    window.AdminLock = { hasPin, setPin, removePin, verifyPin, isUnlocked, unlockSession };
})();
