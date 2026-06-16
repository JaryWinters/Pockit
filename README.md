# Pockit 💸

Een persoonlijke budgetapp op maat, gehost op GitHub Pages met Supabase als database.

## Wat zit er in?

- 📊 **Overzicht** — transacties invoeren, maandoverzicht, budgetten bewaken
- 📈 **Analyse** — grafieken per categorie, inkomsten vs uitgaven over 6 maanden
- 🎯 **Budgetten** — maandlimieten per categorie met voortgangsbalk
- 🪣 **Potjes** — spaarpotjes met doelbedrag (huwelijk, renovatie, vakantie, ...)
- 📱 Volledig mobiel-vriendelijk
- 🔄 Automatische keep-alive ping elke 5 dagen (Supabase pauzeert nooit)
- 💾 Wekelijkse automatische backup naar deze repo

---

## Setup in 3 stappen

### Stap 1 — Supabase project aanmaken

1. Ga naar [supabase.com](https://supabase.com) en maak een gratis account aan
2. Klik **New project** — geef het een naam (bv. `pockit`)
3. Kies een sterk wachtwoord (sla dit op) en een regio dicht bij jou (bv. `West EU`)
4. Wacht tot het project klaar is (~1 minuut)
5. Ga naar **SQL Editor** (linkermenu) → klik **New query**
6. Kopieer de volledige inhoud van `supabase-setup.sql` en plak het in de editor
7. Klik **Run** — je ziet "Success" als alles goed gaat

8. Haal je credentials op via **Settings → API**:
   - **Project URL** → dit is je `VITE_SUPABASE_URL`
   - **anon public** key → dit is je `VITE_SUPABASE_ANON_KEY`

---

### Stap 2 — GitHub repo aanmaken

1. Maak een nieuwe **publieke** GitHub repo aan (bv. `pockit`)
2. Upload alle bestanden uit deze map naar de repo (of gebruik `git push`)

3. Voeg de Supabase credentials toe als **Secrets**:
   - Ga naar je repo → **Settings → Secrets and variables → Actions**
   - Klik **New repository secret** en voeg toe:
     - `VITE_SUPABASE_URL` → jouw Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` → jouw Supabase anon key

---

### Stap 3 — GitHub Pages activeren

1. Ga naar je repo → **Settings → Pages**
2. Onder **Source**: kies **GitHub Actions**
3. Ga naar **Actions** tab → je ziet de workflow "Deploy to GitHub Pages"
4. Als die nog niet gestart is: klik erop → **Run workflow**
5. Na ~1-2 minuten is je app live op:
   ```
   https://JOUW-GEBRUIKERSNAAM.github.io/pockit/
   ```

---

## Automatische workflows

| Workflow | Wanneer | Wat |
|---|---|---|
| `deploy.yml` | Bij elke push naar `main` | Bouwt en deployt de app |
| `keepalive.yml` | Elke 5 dagen | Ping naar Supabase zodat het project nooit pauzeert |
| `backup.yml` | Elke zondag 02:00 | Exporteert alle data als JSON naar de `backups/` map |

---

## Op je gsm installeren (PWA)

- **Android (Chrome)**: open de app → menu → "Toevoegen aan startscherm"
- **iPhone (Safari)**: open de app → deel-knop → "Zet op beginscherm"

Je hebt dan een icoontje op je startscherm zoals een echte app, zonder app store.

---

## Lokaal ontwikkelen

```bash
# Maak een .env.local bestand aan:
echo "VITE_SUPABASE_URL=https://xxxxx.supabase.co" >> .env.local
echo "VITE_SUPABASE_ANON_KEY=eyJ..." >> .env.local

npm install
npm run dev
```

---

## Backup herstellen

Backups staan in de `backups/` map als JSON bestanden per tabel en datum.
Om data te herstellen kan je de JSON inhoud via de Supabase SQL editor importeren,
of de Supabase dashboard tabel-editor gebruiken.
