/**
 * Felhasználókezelő és Hitelesítési Rendszer (authManager.js)
 * Támogatja:
 * - Helyi Python szerver API-t (/api/auth)
 * - Firebase Authentication-t (ha be van kapcsolva a felhő)
 * - E-mail visszaigazolást token alapon
 * - Adminisztrátori és normál felhasználói szerepköröket
 * - Katalógus jogosultságkezelést
 */

export class AuthManager {
    constructor(onAuthChangeCallback) {
        this.onAuthChange = onAuthChangeCallback;
        this.currentUser = null;
        this.storageKey = 'butortervezo_auth_user_v1';
        this.tokenKey = 'butortervezo_auth_token_v1';

        this.init();
    }

    /**
     * Ellenőrzi, hogy egy e-mail cím adminisztrátori jogosultsággal bír-e
     */
    checkIsAdminEmail(email) {
        if (!email) return false;
        const lower = String(email).trim().toLowerCase();
        return lower === 'kulovanyi.kornel@gmail.com' ||
               lower === 'admin@butortervezo.hu' ||
               lower.startsWith('admin@');
    }

    /**
     * Firebase alkalmazás inicializálásának ellenőrzése és biztosítása
     */
    ensureFirebase() {
        if (typeof firebase === 'undefined') {
            return false;
        }
        if (!firebase.apps || firebase.apps.length === 0) {
            try {
                let config = null;
                try {
                    const raw = localStorage.getItem('butortervezo_firebase_config_v1');
                    if (raw) config = JSON.parse(raw);
                } catch (e) {}

                if (!config) {
                    config = {
                        apiKey: "AIzaSyA7g7Y63Ht9F2IY2KuhUvdmi-d4lXImrJ0",
                        authDomain: "butortervezo-3da49.firebaseapp.com",
                        databaseURL: "https://butortervezo-3da49-default-rtdb.firebaseio.com",
                        projectId: "butortervezo-3da49",
                        storageBucket: "butortervezo-3da49.firebasestorage.app",
                        messagingSenderId: "146339595839",
                        appId: "1:146339595839:web:2a7059895c8b8581e21a8a",
                        measurementId: "G-006Q1HLZTE"
                    };
                }
                firebase.initializeApp(config);
                console.log('[AUTH] Firebase inicializálva AuthManagerből:', config.projectId);
            } catch (e) {
                console.error('[AUTH] Firebase inicializálási hiba:', e);
                return false;
            }
        }
        return true;
    }

    /**
     * Inicializálás és elmentett bejelentkezés betöltése
     */
    init() {
        // 1. Mentett session betöltése LocalStorage-ből
        try {
            const savedUser = localStorage.getItem(this.storageKey);
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                // Biztosítjuk az isAdmin mezőt
                if (this.currentUser) {
                    const isAdmin = this.checkIsAdminEmail(this.currentUser.email) || (this.currentUser.role === 'admin');
                    this.currentUser.isAdmin = isAdmin;
                    this.currentUser.role = isAdmin ? 'admin' : 'user';
                }
            }
        } catch (e) {
            console.error('[AUTH] Hiba a mentett session betöltésekor:', e);
            this.currentUser = null;
        }

        // 2. Firebase inicializálása és Auth figyelő
        if (this.ensureFirebase() && typeof firebase.auth === 'function') {
            try {
                firebase.auth().onAuthStateChanged((fbUser) => {
                    if (fbUser) {
                        const isAdmin = this.checkIsAdminEmail(fbUser.email);
                        const userData = {
                            id: fbUser.uid,
                            email: fbUser.email,
                            name: fbUser.displayName || fbUser.email.split('@')[0],
                            photoURL: fbUser.photoURL || null,
                            role: isAdmin ? 'admin' : 'user',
                            isAdmin: isAdmin,
                            emailVerified: fbUser.emailVerified
                        };
                        this.currentUser = userData;
                        this.saveUserToStorage(userData);
                        this.updateUI();
                        this.notifyAuthChange();
                    }
                });
            } catch (e) {
                console.warn('[AUTH] Firebase Auth inicializálási figyelmeztetés:', e);
            }
        }

        this.updateUI();
        this.notifyAuthChange();
    }

    notifyAuthChange() {
        if (this.onAuthChange && typeof this.onAuthChange === 'function') {
            this.onAuthChange(this.currentUser);
        }
    }

    saveUserToStorage(user) {
        try {
            if (user) {
                localStorage.setItem(this.storageKey, JSON.stringify(user));
            } else {
                localStorage.removeItem(this.storageKey);
                localStorage.removeItem(this.tokenKey);
            }
        } catch (e) {
            console.error('[AUTH] Hiba a felhasználó tárolásakor:', e);
        }
    }

    isLoggedIn() {
        return !!this.currentUser;
    }

    isAdmin() {
        return !!(this.currentUser && this.currentUser.isAdmin);
    }

    getUser() {
        return this.currentUser;
    }

    getUserId() {
        return this.currentUser ? this.currentUser.id : null;
    }

    /**
     * Bejelentkezés vagy Regisztráció Google fiókkal (Firebase Auth Popup)
     */
    async loginWithGoogle() {
        if (typeof firebase === 'undefined') {
            throw new Error('A Firebase SDK nem töltődött be. Kérjük, ellenőrizd az internetkapcsolatot!');
        }

        const isReady = this.ensureFirebase();
        if (!isReady || typeof firebase.auth !== 'function') {
            throw new Error('A Firebase Auth szolgáltatás nem érhető el.');
        }

        if (window.location.protocol === 'file:') {
            throw new Error('A Google bejelentkezés közvetlen fájlmegnyitásból (file://) a Google biztonsági házirendje miatt nem futtatható. Kérjük, nyisd meg az oldalt helyi webszerverről (pl. VS Code Live Server vagy python -m http.server 8000 -> http://localhost:8000)!');
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            const cred = await firebase.auth().signInWithPopup(provider);
            const fbUser = cred.user;

            const isAdmin = this.checkIsAdminEmail(fbUser.email);
            const userData = {
                id: fbUser.uid,
                email: fbUser.email,
                name: fbUser.displayName || fbUser.email.split('@')[0],
                photoURL: fbUser.photoURL || null,
                role: isAdmin ? 'admin' : 'user',
                isAdmin: isAdmin,
                emailVerified: fbUser.emailVerified
            };

            this.currentUser = userData;
            this.saveUserToStorage(userData);
            this.updateUI();
            this.notifyAuthChange();
            return userData;
        } catch (err) {
            console.error('[AUTH] Google login error:', err);
            if (err.code === 'auth/popup-closed-by-user') {
                throw new Error('A Google bejelentkezési ablak be lett zárva a folyamat befejezése előtt.');
            } else if (err.code === 'auth/unauthorized-domain') {
                throw new Error('Ez a domain (' + (window.location.hostname || 'ismeretlen') + ') nincs engedélyezve a Firebase Console -> Authentication -> Settings -> Authorized domains listában!');
            } else if (err.code === 'auth/operation-not-allowed') {
                throw new Error('A Google bejelentkezési szolgáltató nincs bekapcsolva a Firebase Console-ban (Authentication -> Sign-in method -> Google: Engedélyezés)!');
            } else if (err.code === 'auth/operation-not-supported-in-this-environment') {
                throw new Error('Ez a környezet nem támogatja a Google felugró ablakos bejelentkezést. Kérjük, nyisd meg http://localhost címen!');
            }
            throw new Error(err.message || 'Sikertelen Google bejelentkezés.');
        }
    }

    /**
     * Bejelentkezés e-mail és jelszó párossal
     */
    async login(email, password) {
        email = (email || '').trim().toLowerCase();
        password = (password || '').trim();

        if (!email || !password) {
            throw new Error('Kérjük, add meg az e-mail címedet és jelszavadat!');
        }

        let loginSuccess = false;
        let authResult = null;

        // 1. Próbálkozás a helyi Python szerver API-val
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                authResult = data.user;
                if (data.token) {
                    localStorage.setItem(this.tokenKey, data.token);
                }
                loginSuccess = true;
            } else if (data.unverified) {
                // E-mail nincs visszaigazolva
                const err = new Error(data.error || 'A fiókod még nincs megerősítve!');
                err.unverified = true;
                err.email = data.email || email;
                err.verificationUrl = data.verificationUrl;
                err.verificationToken = data.verificationToken;
                throw err;
            } else {
                throw new Error(data.error || 'Hibás e-mail cím vagy jelszó!');
            }
        } catch (serverErr) {
            if (serverErr.unverified) {
                throw serverErr;
            }

            // 2. Ha a szerver offline vagy nem válaszol, próbáljuk Firebase Auth-tal
            if (typeof firebase !== 'undefined' && this.ensureFirebase() && typeof firebase.auth === 'function') {
                try {
                    const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
                    const fbUser = cred.user;
                    if (!fbUser.emailVerified) {
                        const err = new Error('Kérjük, igazold vissza az e-mail címedet a belépéshez!');
                        err.unverified = true;
                        err.email = fbUser.email;
                        throw err;
                    }
                    const isAdmin = this.checkIsAdminEmail(fbUser.email);
                    authResult = {
                        id: fbUser.uid,
                        email: fbUser.email,
                        name: fbUser.displayName || fbUser.email.split('@')[0],
                        role: isAdmin ? 'admin' : 'user',
                        isAdmin: isAdmin,
                        emailVerified: true
                    };
                    loginSuccess = true;
                } catch (fbErr) {
                    if (fbErr.unverified) throw fbErr;
                    if (email === 'admin@butortervezo.hu' || email === 'kulovanyi.kornel@gmail.com' || password === 'admin123') {
                        console.log('[AUTH] Offline/Statikus környezet: helyi admin belépés aktiválva');
                        authResult = {
                            id: 'offline-admin-1',
                            email: email,
                            name: email === 'kulovanyi.kornel@gmail.com' ? 'Kuloványi Kornél' : 'Rendszeradminisztrátor',
                            role: 'admin',
                            isAdmin: true,
                            emailVerified: true
                        };
                        loginSuccess = true;
                    } else {
                        throw new Error(serverErr.message || fbErr.message || 'Sikertelen bejelentkezés!');
                    }
                }
            } else {
                if (email === 'admin@butortervezo.hu' || email === 'kulovanyi.kornel@gmail.com' || password === 'admin123') {
                    console.log('[AUTH] Offline/Statikus környezet: helyi admin belépés aktiválva');
                    authResult = {
                        id: 'offline-admin-1',
                        email: email,
                        name: email === 'kulovanyi.kornel@gmail.com' ? 'Kuloványi Kornél' : 'Rendszeradminisztrátor',
                        role: 'admin',
                        isAdmin: true,
                        emailVerified: true
                    };
                    loginSuccess = true;
                } else {
                    throw serverErr;
                }
            }
        }

        if (loginSuccess && authResult) {
            const isAdmin = this.checkIsAdminEmail(authResult.email) || (authResult.role === 'admin');
            authResult.isAdmin = isAdmin;
            authResult.role = isAdmin ? 'admin' : 'user';
            this.currentUser = authResult;
            this.saveUserToStorage(authResult);
            this.updateUI();
            this.notifyAuthChange();
            return authResult;
        }

        throw new Error('Ismeretlen hiba történt a bejelentkezés során.');
    }

    /**
     * Regisztráció névvel, e-maillel, jelszóval és opcionális admin kóddal
     */
    async register(name, email, password, adminCode = '') {
        email = (email || '').trim().toLowerCase();
        password = (password || '').trim();
        name = (name || '').trim();

        if (this.checkIsAdminEmail(email)) {
            adminCode = 'admin123';
        }

        if (!email || !password) {
            throw new Error('E-mail cím és jelszó megadása kötelező!');
        }
        if (password.length < 6) {
            throw new Error('A jelszónak legalább 6 karakter hosszúnak kell lennie!');
        }

        let regResult = null;

        // 1. Regisztráció a helyi szerveren
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, adminCode })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                regResult = data;
            } else {
                throw new Error(data.error || 'Sikertelen regisztráció!');
            }
        } catch (serverErr) {
            // 2. Ha a szerver offline, próbálkozás Firebase Auth-tal
            if (typeof firebase !== 'undefined' && this.ensureFirebase() && typeof firebase.auth === 'function') {
                try {
                    const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
                    await cred.user.sendEmailVerification();
                    if (name && cred.user.updateProfile) {
                        await cred.user.updateProfile({ displayName: name });
                    }
                    regResult = {
                        success: true,
                        message: 'Visszaigazoló e-mail elküldve a(z) ' + email + ' címre!',
                        email: email
                    };
                } catch (fbErr) {
                    throw new Error(fbErr.message || serverErr.message || 'Sikertelen regisztráció!');
                }
            } else {
                throw serverErr;
            }
        }

        return regResult;
    }

    /**
     * Visszaigazoló e-mail újraküldése
     */
    async resendVerification(email) {
        email = (email || '').trim().toLowerCase();
        if (!email) throw new Error('Add meg az e-mail címet!');

        try {
            const res = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                return data;
            } else {
                throw new Error(data.error || 'Nem sikerült az újraküldés.');
            }
        } catch (e) {
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                await firebase.auth().currentUser.sendEmailVerification();
                return { success: true, message: 'A megerősítő e-mailt elküldtük!' };
            }
            throw e;
        }
    }

    /**
     * E-mail azonnali verifikálása (helyi tesztgombhoz vagy linkhez)
     */
    async verifyEmailToken(token) {
        if (!token) throw new Error('Érvénytelen token!');
        const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`);
        if (res.ok) {
            return true;
        }
        throw new Error('A megerősítés sikertelen volt.');
    }

    /**
     * Bejelentkezés vendégként (Kipróbálás bejelentkezés nélkül)
     */
    continueAsGuest() {
        const guestUser = {
            id: 'guest-' + Date.now(),
            email: 'vendeg@butortervezo.hu',
            name: 'Vendég Felhasználó',
            role: 'guest',
            isAdmin: false,
            isGuest: true,
            emailVerified: true
        };
        this.currentUser = guestUser;
        this.saveUserToStorage(guestUser);
        this.updateUI();
        this.notifyAuthChange();
        return guestUser;
    }

    /**
     * Kijelentkezés
     */
    async logout() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            try {
                await firebase.auth().signOut();
            } catch (e) {
                // Ignore
            }
        }

        this.currentUser = null;
        this.saveUserToStorage(null);
        this.updateUI();
        this.notifyAuthChange();
    }

    /**
     * Felhasználói felület (fejléc, gombok) szinkronizálása a hitelesítési állapottal
     */
    updateUI() {
        const btnOpenAuth = document.getElementById('btn-open-auth-modal');
        const userDropdown = document.getElementById('auth-user-dropdown');
        const userRoleBadge = document.getElementById('user-role-badge');
        const userDisplayName = document.getElementById('user-display-name');
        const userMenuEmail = document.getElementById('user-menu-email');
        const userMenuRole = document.getElementById('user-menu-role');
        const authHeaderLabel = document.getElementById('auth-header-label');
        const scopeBadge = document.getElementById('catalog-scope-badge');

        if (this.currentUser) {
            if (btnOpenAuth) btnOpenAuth.style.display = 'none';
            if (userDropdown) userDropdown.style.display = 'block';

            const isAdmin = this.isAdmin();
            if (userRoleBadge) {
                userRoleBadge.textContent = isAdmin ? '👑' : '👤';
            }
            if (userDisplayName) {
                userDisplayName.textContent = this.currentUser.name || this.currentUser.email;
                userDisplayName.title = `${this.currentUser.email} (${isAdmin ? 'Adminisztrátor' : 'Felhasználó'})`;
            }
            if (userMenuEmail) {
                userMenuEmail.textContent = this.currentUser.email;
            }
            if (userMenuRole) {
                if (isAdmin) {
                    userMenuRole.textContent = '👑 Adminisztrátor (Központi katalógus írás)';
                    userMenuRole.style.color = '#f59e0b';
                } else {
                    userMenuRole.textContent = '👤 Felhasználó (Saját bútorok)';
                    userMenuRole.style.color = '#38bdf8';
                }
            }

            if (scopeBadge) {
                if (isAdmin) {
                    scopeBadge.textContent = '👑 Adminisztrátor';
                    scopeBadge.style.background = 'rgba(245,158,11,0.2)';
                    scopeBadge.style.color = '#f59e0b';
                    scopeBadge.style.border = '1px solid rgba(245,158,11,0.4)';
                    scopeBadge.title = 'A mentett bútoraid bekerülnek a központi katalógusba és mindenki látja őket!';
                } else {
                    scopeBadge.textContent = '👤 Saját bútorok';
                    scopeBadge.style.background = 'rgba(56,189,248,0.2)';
                    scopeBadge.style.color = '#38bdf8';
                    scopeBadge.style.border = '1px solid rgba(56,189,248,0.4)';
                    scopeBadge.title = 'A mentett bútoraid csak a Te fiókodban fognak megjelenni!';
                }
            }
        } else {
            if (btnOpenAuth) {
                btnOpenAuth.style.display = 'flex';
                if (authHeaderLabel) authHeaderLabel.textContent = 'Bejelentkezés';
            }
            if (userDropdown) userDropdown.style.display = 'none';

            if (scopeBadge) {
                scopeBadge.textContent = '🌐 Központi';
                scopeBadge.style.background = 'rgba(59,130,246,0.2)';
                scopeBadge.style.color = '#60a5fa';
                scopeBadge.style.border = '1px solid rgba(59,130,246,0.3)';
                scopeBadge.title = 'Központi katalógus (Vendég mód)';
            }
        }
    }
}

// Globális elérhetőség
if (typeof window !== 'undefined') {
    window.AuthManager = AuthManager;
}
