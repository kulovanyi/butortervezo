/**
 * Firebase Realtime Database Szinkronizációs Menedzser (firebaseSync.js)
 * Lehetővé teszi, hogy a weben (GitHub Pages vagy böngésző) futtatott alkalmazás
 * ingyenes Google Firebase felhőbe mentse és valós időben szinkronizálja a katalógust.
 */

export const FirebaseSync = {
    app: null,
    db: null,
    isConnected: false,
    storageKeyConfig: 'butortervezo_firebase_config_v1',
    listeners: [],

    // Opcionális beépített alapértelmezett Firebase konfiguráció
    defaultConfig: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: ""
    },

    /**
     * Firebase inicializálása
     */
    init(onCatalogUpdateCallback) {
        if (onCatalogUpdateCallback) {
            this.listeners.push(onCatalogUpdateCallback);
        }

        const config = this.getConfig();
        if (config && config.apiKey && config.projectId) {
            this.connect(config);
        } else {
            console.log('[FIREBASE] Nincs konfigurálva Firebase adatbázis (Helyi mód aktív).');
        }
    },

    /**
     * Elmentett vagy alapértelmezett konfiguráció lekérése
     */
    getConfig() {
        try {
            const saved = localStorage.getItem(this.storageKeyConfig);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Hiba a Firebase config betöltésekor:', e);
        }
        return this.defaultConfig;
    },

    /**
     * Konfiguráció mentése és újracsatlakozás
     */
    saveConfig(config) {
        try {
            localStorage.setItem(this.storageKeyConfig, JSON.stringify(config));
            return this.connect(config);
        } catch (e) {
            console.error('Hiba a Firebase config mentésekor:', e);
            return false;
        }
    },

    /**
     * Csatlakozás a Firebase-hez
     */
    connect(config) {
        if (typeof firebase === 'undefined') {
            console.warn('[FIREBASE] A Firebase SDK nem töltődött be.');
            this.isConnected = false;
            return false;
        }

        try {
            // Ha már fut egy app, töröljük vagy használjuk
            if (firebase.apps && firebase.apps.length > 0) {
                this.app = firebase.apps[0];
            } else {
                this.app = firebase.initializeApp(config);
            }

            this.db = firebase.database();
            this.isConnected = true;
            console.log('[FIREBASE] Sikeres csatlakozás a felhőhöz! Project:', config.projectId);

            // Valós idejű figyelő beállítása
            this.setupRealtimeListener();
            this.updateStatusUI(true);
            return true;
        } catch (e) {
            console.error('[FIREBASE] Csatlakozási hiba:', e);
            this.isConnected = false;
            this.updateStatusUI(false, e.message);
            return false;
        }
    },

    /**
     * Valós idejű adatfigyelés a Firebase-ből
     */
    setupRealtimeListener() {
        if (!this.db) return;

        try {
            const catalogRef = this.db.ref('catalog');
            catalogRef.on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    console.log('[FIREBASE] Új katalógus adatok érkeztek a felhőből:', data);
                    this.listeners.forEach(cb => {
                        try {
                            cb(data);
                        } catch (err) {
                            console.error('Hiba a katalógus frissítő callbackben:', err);
                        }
                    });
                }
            }, (error) => {
                console.error('[FIREBASE] Adatlekérési hiba (jogosultság?):', error);
            });
        } catch (e) {
            console.error('[FIREBASE] Figyelő hiba:', e);
        }
    },

    /**
     * Katalógus mentése a Firebase felhőbe
     */
    async saveCatalog(categories, items, actionName = 'Katalógus mentés') {
        if (!this.isConnected || !this.db) {
            return false;
        }

        try {
            const payload = {
                version: '1.0',
                lastUpdated: new Date().toISOString(),
                lastAction: actionName,
                categories: categories || [],
                items: items || []
            };

            await this.db.ref('catalog').set(payload);
            console.log(`[FIREBASE] Sikeres felhő mentés: ${items.length} bútor, ${categories.length} kategória.`);
            return true;
        } catch (e) {
            console.error('[FIREBASE] Mentési hiba a felhőbe:', e);
            return false;
        }
    },

    /**
     * Felhasználói felület státuszfrissítése (zöld/szürke pont)
     */
    updateStatusUI(connected, errorMsg = '') {
        const dot = document.getElementById('firebase-status-dot');
        const badge = document.getElementById('firebase-status-badge');

        if (dot) {
            dot.style.background = connected ? '#10b981' : '#ef4444';
        }
        if (badge) {
            if (connected) {
                badge.textContent = '🟢 Csatlakozva a felhőhöz';
                badge.style.background = 'rgba(16, 185, 129, 0.2)';
                badge.style.color = '#10b981';
            } else {
                badge.textContent = errorMsg ? `🔴 Hiba: ${errorMsg}` : '⚪ Nincs beállítva (Helyi mód)';
                badge.style.background = 'rgba(239, 68, 68, 0.15)';
                badge.style.color = '#ef4444';
            }
        }
    }
};

// Globális elérhetőség
if (typeof window !== 'undefined') {
    window.FirebaseSync = FirebaseSync;
}
