# 📐 3D Modern Bútortervező és Katalógus Rendszer

Egy korszerű, böngészőben futó 3D bútortervező alkalmazás, ahol valós mm méretekkel építhetsz bútorokat, mágnesesen és precízen illeszthetsz egymáshoz bútorlapokat, tetszőleges fa- és dekortextúrákat (vagy saját feltöltött képeket) alkalmazhatsz, valamint a kész bútorokat kategóriákba rendezve elmentheted a bal oldali interaktív katalógusba automatikus 3D fotóval.

---

## 🚀 Indítás

### 1. Dupla kattintással:
Csak indítsd el a **`start.bat`** fájlt, és a böngésződ automatikusan megnyitja az alkalmazást: `http://localhost:8080/`.

### 2. Parancssorból:
```bash
py server.py
```
Vagy nyisd meg az `index.html` fájlt közvetlenül bármelyik modern böngészőben!

---

## ✨ Főbb Funkciók

### 1. 3D Munkatér & Geometria
- **Valósághű 3D nézet**: Háromdimenziós stúdió megvilágítás, árnyékok és mm-es raszter háló.
- **Kamera nézőpontok**: Izometrikus, Elölnézet, Felülnézet és Oldalnézet gyorsgombok.
- **Transzformációs vezérlő (Gizmo)**:
  - **W**: Mozgatás (1 mm, 10 mm, 18 mm, 50 mm raszter snap lépésekkel).
  - **E**: Forgatás (90°-os és tetszőleges szögű elforgatások).
- **Robbantott nézet (Exploded View)**: Csúszka a bútorlapok fokozatos széthúzásához az összeszerelés áttekintéséhez.

### 2. 🍳 Paraméteres Konyha Korpusz Tervező Varázsló
- **Egyedi alsó-, felső- és kamraszekrény generálás**:
  - **Fő méretek**: Szélesség (300 .. 1200 mm), Magasság (600 .. 2000 mm), Mélység (300 .. 600 mm), Lapvastagság (18mm, 19mm).
  - **Első összekötő léc**: Szélessége, fekvő vagy élre állított pozíció, és **pontos eltolása elölről (mennyivel legyen beljebb a korpusz első síkjától)**.
  - **Hátsó összekötő léc**: Szélessége, fekvő/álló pozíció, és **eltolása hátulról**.
  - **Hátfal és falhézag**: 3 mm HDF vagy 18 mm bútorlap, nútba ültetett / falcolt / rászegelt rögzítés, és **hátfal bemélyesztése a falnál lévő csövek/vezetékek számára**.
  - **Lábak & Szokli**: Állítható konyhalábak (100mm, 150mm), valamint **szokli takaróléc pontos visszaugrása / eltolása a fronttól a lábtérhez**.
  - **Konyhai Munkalap**: 28mm / 38mm munkalap **elülső túllógás (overhang)** beállítással.
  - **Belső polcok**: Automatikusan kiosztott állítható polcok és front hézag.
  - **Konyhasor építés**: "Lecserélés" vagy "Hozzáadás a jelenethez" (szekrények egymás mellé rendezése).

### 3. Bútorlapok & Intelligens Illesztés (Snapping)
- **Lapméretek mm pontossággal**: Szélesség ($X$), Magasság / Vastagság ($Y$), Mélység ($Z$).
- **Gyors vastagságok**: 18 mm, 19 mm, 28 mm, 38 mm, 3 mm (HDF hátfal).
- **Mágneses felület-illesztés (Snap to face)**:
  - Lap tetejére / aljára helyezés (Stacking).
  - Bal / Jobb oldalhoz tapasztás (kívülről vagy belülről).
  - Elülső és hátsó felületekhez illesztés tetszőleges mm-es hézaggal / eltolással.
- **Élek egy vonalba igazítása**: Bal, jobb, felső, alsó szélek vagy középpontok összeigazítása.
- **Automatikus Polc méretező**: Két oldalfal közé automatikusan kiszámítja a pontos polcméretet és beilleszti!

### 3. Textúrák & Anyagok
- **Beépített prémium dekorok**:
  - *Natúr Tölgy, Sonoma Tölgy, Sötét Dió, Meleg Bükk, Skandináv Fenyő*
  - *Prémium Fehér Matt, Kasmír Bézs, Antracit Szürke, Matt Fekete, Loft Beton*
- **📷 Egyéni textúra feltöltés**: Tölts fel bármilyen képet (.jpg, .png) a saját bútorlapjaidhoz!
- **Hatókör**: Alkalmazás a kijelölt lapra vagy az egész bútorra egyszerre.

### 4. Bal Oldali Katalógus & Kategóriakezelő
- **Kategóriák**: Hozz létre új kategóriákat (pl. *Konyhabútor, Nappali, Gardrób, Iroda*), egyedi színekkel.
- **Mentés 3D Fotóval**: Egy kattintással elmentheted a jelenlegi bútort: a rendszer automatikusan nagyfelbontású 3D előnézeti képet generál a kártyához!
- **Visszatöltés vagy Melléillesztés**: Bútor visszatöltése szerkesztésre, vagy új elemként való hozzáadása a meglévő szobához.
- **JSON Export / Import**: Mentsd le a teljes katalógust fájlba vagy töltsd be másik gépen.

### 5. Szabászati és Alkatrész Jegyzék (Cut List)
- Pontos mm méretek táblázatos összefoglalása minden laphoz.
- $m^2$ felület és szükséges élzárás ($fm$) kalkuláció.
- Becsült anyagköltség számítás.
- **Excel (CSV) letöltés** és **Nyomtatható / PDF jegyzék** generálás.

---

## ⌨️ Egér és Billentyűzet Vezérlés (Unreal Engine Navigáció)

| Kezelőszerv | Funkció |
| :--- | :--- |
| **Egér Középső Gomb (Görgő)** | **Pan kamera mozgatás** (síkban való húzás / eltolás) |
| **Egér Jobb Gomb (Nyomva tartva)** | **Unreal Engine stílusú szabad körbenézés (Look around)** |
| **Jobb Gomb + W, A, S, D** | **Repülés a térben (Fly mode)** Előre, Hátra, Balra, Jobbra |
| **Jobb Gomb + Q / E (vagy Space)** | Kamera süllyesztése / emelése (Le / Fel) |
| **Jobb Gomb + Shift** | Gyorsabb repülés (Sebesség Boost) |
| **Jobb Gomb + Görgő** | Repülési alapsebesség növelése / csökkentése |
| **Egér Bal Gomb** | Bútorlap kijelölése / Forgatás a tárgy körül (Orbit) |
| **Görgő** | Zoomolás (Közelítés / Távolítás) |
| **W (normál módban)** | Mozgatás eszköz (Translate Gizmo) |
| **E (normál módban)** | Forgatás eszköz (Rotate Gizmo) |
| **Ctrl + D** | Kijelölt lap duplikálása / másolása |
| **Delete / Backspace** | Kijelölt lap törlése |
