# ClipContest — Phase 1: Landingpage + Waitlist

> Starte einen Clip-Contest, tracke Views, Live-Leaderboard, 1–3 Gewinner, Auszahlung über uns.

---

## 🚀 Schnellstart (lokal)

```bash
# 1. Dependencies installieren
npm install

# 2. Env-Datei anlegen
cp .env.local.example .env.local
# → .env.local ausfüllen (Supabase-Keys)

# 3. Dev-Server starten
npm run dev
# → http://localhost:3000
```

---

## 🗄 Supabase Setup (5 Minuten)

1. Geh auf [supabase.com](https://supabase.com) und erstelle ein neues Projekt.
2. Öffne den **SQL Editor** und führe dieses SQL aus:

```sql
CREATE TABLE waitlist (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  email       text NOT NULL UNIQUE,
  role        text NOT NULL CHECK (role IN ('creator', 'participant')),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert" ON waitlist
  FOR INSERT TO anon WITH CHECK (true);
```

3. Geh zu **Project Settings → API** und kopiere:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public` Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` Key → `SUPABASE_SERVICE_ROLE_KEY`

4. Füge die Keys in `.env.local` ein.

---

## 📧 E-Mail Setup (optional, empfohlen)

Wir nutzen [Resend](https://resend.com) für Transaktions-Mails (kostenlos bis 3.000 Mails/Monat).

1. Account auf [resend.com](https://resend.com) erstellen
2. Domain verifizieren (DNS-Einträge)
3. API Key erstellen → in `.env.local` eintragen
4. In `src/app/api/waitlist/route.ts` den auskommentierten Email-Block einkommentieren
5. Absender-Adresse (`from`) anpassen

---

## ☁️ Deployment auf Vercel

```bash
# 1. GitHub Repo erstellen und Code pushen
git init
git add .
git commit -m "Initial commit: ClipContest Phase 1"
git remote add origin https://github.com/DEIN-USERNAME/clipcontest.git
git push -u origin main

# 2. Auf vercel.com:
#    - "New Project" → GitHub Repo auswählen
#    - Environment Variables eintragen (aus .env.local)
#    - Deploy klicken
```

**Env Variables in Vercel eintragen:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (wenn E-Mail aktiv)

---

## 🎨 Branding anpassen

| Was | Wo |
|---|---|
| Name "ClipContest" | Suche & Ersetze in allen `.tsx`-Dateien |
| Brand-Farbe (pink) | `tailwind.config.ts` → `colors.brand.500` |
| Meta-Title/Description | `src/app/layout.tsx` |
| Kontakt-E-Mail | `src/components/Footer.tsx` |
| Preise | `src/components/Pricing.tsx` |
| FAQ-Antworten | `src/components/FAQ.tsx` |

---

## 📊 Analytics

**Plausible (empfohlen, DSGVO-konform):**
1. Account auf [plausible.io](https://plausible.io) erstellen
2. Domain hinzufügen
3. Script-Tag in `src/app/layout.tsx` einfügen:
```html
<script defer data-domain="deinedomain.de" src="https://plausible.io/js/script.js"></script>
```

---

## 📁 Projektstruktur

```
src/
├── app/
│   ├── api/waitlist/route.ts   # Waitlist API (POST)
│   ├── globals.css             # Global Styles
│   ├── layout.tsx              # Root Layout + Meta
│   └── page.tsx                # Hauptseite
├── components/
│   ├── Navbar.tsx
│   ├── Hero.tsx                # Headline + Waitlist-CTA
│   ├── HowItWorks.tsx          # 4-Schritte-Erklärung
│   ├── ForWho.tsx              # Zielgruppen
│   ├── Pricing.tsx             # Preispläne
│   ├── FAQ.tsx                 # Häufige Fragen
│   ├── WaitlistForm.tsx        # Formular-Komponente
│   └── Footer.tsx
└── lib/
    └── supabase.ts             # Supabase Client
```

---

## ✅ Checkliste vor Launch

- [ ] Domain gekauft und in Vercel konfiguriert
- [ ] Supabase Tabelle erstellt
- [ ] E-Mail-Versand getestet (Resend)
- [ ] Impressum, Datenschutz, AGB Seiten erstellt (`/impressum`, `/datenschutz`, `/agb`)
- [ ] Analytics eingebaut (Plausible/GA)
- [ ] Branding & Farben angepasst
- [ ] Preise final gesetzt
- [ ] Warteliste-E-Mail Adresse im Footer aktualisiert
- [ ] Mobile-Ansicht getestet
- [ ] OG-Bild für Social Sharing erstellt (`public/og.png`, 1200×630px)

---

*Phase 2: App-Grundgerüst (Login + Dashboard) →* `TODO`
