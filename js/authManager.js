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
                    this.currentUser.isAdmin = (this.currentUser.role === 'admin' || (this.currentUser.email && this.currentUser.email.startsWith('admin@')));
                }
            }
        } catch (e) {
            console.error('[AUTH] Hiba a mentett session betöltésekor:', e);
            this.currentUser = null;
        }

        // 2. Firebase Auth figyelő (ha elérhető a Firebase Auth SDK)
        if (typeof firebase !== 'undefined' && firebase.auth) {
            try {
                firebase.auth().onAuthStateChanged((fbUser) => {
                    if (fbUser) {
                        const isAdmin = fbUser.email && (fbUser.email.startsWith('admin@') || fbUser.email === 'admin@butortervezo.hu');
                        const userData = {
                            id: fbUser.uid,
                            email: fbUser.email,
                            name: fbUser.displayName || fbUser.email.split('@')[0],
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
            if (typeof firebase !== 'undefined' && firebase.auth) {
                try {
                    const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
                    const fbUser = cred.user;
                    if (!fbUser.emailVerified) {
                        const err = new Error('Kérjük, igazold vissza az e-mail címedet a belépéshez!');
                        err.unverified = true;
                        err.email = fbUser.email;
                        throw err;
                    }
                    const isAdmin = fbUser.email && (fbUser.email.startsWith('admin@') || fbUser.email === 'admin@butortervezo.hu');
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
                    throw new Error(serverErr.message || fbErr.message || 'Sikertelen bejelentkezés!');
                }
            } else {
                throw serverErr;
            }
        }

        if (loginSuccess && authResult) {
            authResult.isAdmin = (authResult.role === 'admin' || (authResult.email && authResult.email.startsWith('admin@')));
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
            if (typeof firebase !== 'undefined' && firebase.auth) {
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
