# Café Pilates – web

Čistě statický web (HTML + CSS + trocha JavaScriptu), bez sestavování. Obsah této složky patří do kořene repozitáře `davidrynes/cafepilates` na GitHubu, ze kterého web automaticky publikuje Netlify na `https://www.cafepilates.cz`.

## Nasazení

1. Obsah této složky nahrajte do kořene repozitáře `cafepilates` (včetně souborů `_redirects` a `.nojekyll`). Stejně pojmenované soubory se přepíšou – to je v pořádku.
2. **V repozitáři nechte beze změny** složky `css/`, `js/`, `images/`, `fonts/`, `documents/` a soubor `cafe-pilates-obrazovka.html` (starý export z Webflow). Nový web je nepoužívá; dokud tam jsou, nic se nerozbije. Až nebudou potřeba, dají se smazat.
3. Netlify po nahrání web sám publikuje (obvykle do minuty). Soubor `_redirects` trvale přesměruje staré adresy `cafe-pilates-l-…` na nové stránky.

Web počítá s doménou `https://www.cafepilates.cz` (odkazy pro Google a sociální sítě v hlavičkách stránek, `sitemap.xml`, `robots.txt`).

Adresy fungují i bez `.html` – Netlify servíruje `menu.html` i na `/menu`.

## Stránky

| Soubor | Obsah |
|---|---|
| `index.html` | Úvodní stránka (nahoře lišta s oznámením) |
| `menu.html` | Jídelní a nápojový lístek |
| `pilates.html` | Co je pilates, pro koho je, historie |
| `instruktorky.html` | Lektorky – hlavní tým a další lektorky |
| `rozvrh-a-cenik.html` | Rozvrh, rezervace (Bookeo), ceník, storno podmínky |
| `oslavy.html` | Oslavy a nabídka občerstvení |
| `vystavy.html` | Vernisáže a výstavy |
| `kontakt.html` | Kontakt, mapa, fakturační údaje |
| `ochrana-osobnich-udaju.html` | Souhlas se zpracováním osobních údajů |
| `blog/elixir-prodlouzeneho-mladi.html` | Článek |
| `obrazovka.html` | Obrazovka (televize) v kavárně na `/obrazovka` |
| `404.html` | Stránka pro neexistující adresu |
| `cafe-pilates-l-*.html` | Záložní přesměrování ze starých adres webu (nemazat) |
| `_redirects` | Trvalá přesměrování starých adres pro Netlify |

## Časté úpravy

**Rozvrh** – jen v souboru `assets/js/rozvrh.js`. Každá lekce je jeden řádek; postup je popsaný na začátku souboru. Z těchto dat se vykresluje rozvrh na stránce Rozvrh a ceník; `profil: "id-lektorky"` udělá ze jména odkaz na profil lektorky.

**Oznámení nahoře** – v `index.html` blok `<div class="announce">…</div>`. Když není co oznamovat, celý blok smažte.

**Ceny** – `rozvrh-a-cenik.html` (ceník) a v `index.html` „Ceník v kostce“. Při změně upravte obě místa.

**Lektorky** – `instruktorky.html`. Každá lektorka je jeden blok `<article … id="…">`. Fotky jsou v `assets/img/lektorky/` jako čtverce 720 × 720 px v rámečku s lístky a logem na bílém pozadí (stejně jako původní grafiky). Bílé pozadí na webu splyne se světlou kartou. Lektorka bez fotky má zatím siluetu v rámečku (`veronika-l.webp`). Řada fotek na úvodní stránce je v `index.html` (sekce „Náš tým“).

**Polévky na obrazovce v kavárně (každý týden)** – na `/obrazovka` běží obrázky dokola (každý 8 s, prolnutí 5 s). Polévky se mění výměnou jednoho souboru:
1. na GitHubu v repozitáři otevřete složku `assets/img/obrazovka/`,
2. **Add file → Upload files**, nahrajte nový obrázek pojmenovaný přesně `polevky.jpg` (na výšku 9 : 16, např. 1080 × 1920 px) a potvrďte **Commit changes**,
3. obrazovka si nové polévky sama načte do 30 minut – na televizi ani v HTML se nic nemění.

**Už se nenahrává** `obrazovka.html` ani `images/polevky-DDMMRR.jpg` z Webflow. Nahraný Webflow `obrazovka.html` by novou obrazovku přepsal tou starou.

Ostatní obrázky obrazovky jsou ve stejné složce a jejich pořadí je v `obrazovka.html` (jeden řádek `<img>` = jeden obrázek). Stará zkušební adresa `/obrazovka-nova` přesměrovává na `/obrazovka`.

**Hlavička a patička** jsou v každé stránce zvlášť. Když se mění menu, telefon nebo otevírací doba, upravte je ve všech `.html` souborech (hledat a nahradit).

## Technické poznámky

- Písma: Panchang je uložený ve webu (`assets/fonts/`), DM Sans se načítá z Google Fonts.
- Mapa na stránce Kontakt se načte až po kliknutí (bez cookies Googlu předem). Web sám nepoužívá analytiku ani sledovací cookies, proto nemá cookie lištu. Rezervační systém na stránce Rozvrh je vložený z bookeo.com.
- Styly: `assets/css/styles.css`, barvy jsou na začátku souboru v `:root`.
