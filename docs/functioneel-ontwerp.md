# Functioneel Ontwerp: NT2-Leerapplicatie

**Werktitel:** TaalMaat (of vrij te kiezen — zie toelichting bij branding)
**Versie:** 1.0 — Functioneel Ontwerp
**Doelgroep document:** ontwikkelteam, docenten-stakeholders, UX-designers

---

## 1. Uitgangspunten en ontwerpprincipes

Voordat de schermen worden uitgewerkt, eerst de leidende principes — deze bepalen elke keuze verderop:

1. **Taalarm waar mogelijk.** NT2-leerders (zeker Alfa/A1) hebben moeite met complexe interfacetaal. Gebruik iconen + korte woorden, vermijd jargon, gebruik altijd dezelfde term voor hetzelfde concept (consistentie is cruciaal bij taalverwerving).
2. **Grote, duidelijke tapdoelen.** Minimaal 44×44 px, veel witruimte, geen drukke schermen.
3. **Directe feedback.** Elke actie geeft onmiddellijk visuele/auditieve bevestiging (groen vinkje + geluid bij goed, zachte correctie bij fout — nooit een "hard" foutsignaal, dat werkt demotiverend).
4. **Voorspelbare navigatie.** Altijd dezelfde plek voor "terug", altijd een zichtbare voortgangsindicator tijdens oefeningen.
5. **Toegankelijkheid (WCAG 2.1 AA):** hoog contrast, ondersteuning voor tekst-naar-spraak, dyslexievriendelijk lettertype als optie (bijv. OpenDyslexic of Atkinson Hyperlegible), instelbare tekstgrootte.
6. **Twee duidelijk gescheiden "werelden"**: docent = beheer & inzicht (informatiedicht, tabel-georiënteerd); leerling = speels & motiverend (kaart-georiënteerd, kleurrijk, game-achtig) — zelfde designtaal (kleuren, typografie), andere dichtheid.

---

## 2. Algemene structuur & Homepage

### 2.1 Landingspagina / Inlogscherm

**Layout (wireframe-beschrijving):**

```
┌─────────────────────────────────────────┐
│  [Logo + appnaam]           [Taal: NL▾] │
│                                          │
│         Grote illustratie/mascotte      │
│      "Leer Nederlands, stap voor stap"  │
│                                          │
│   ┌───────────────┐  ┌───────────────┐  │
│   │  Ik ben een   │  │  Ik ben een   │  │
│   │   LEERLING    │  │    DOCENT     │  │
│   │   [icoon]     │  │   [icoon]     │  │
│   └───────────────┘  └───────────────┘  │
│                                          │
│   E-mail / gebruikersnaam: [_________]  │
│   Wachtwoord:               [_________] │
│   [ Inloggen ]     Wachtwoord vergeten? │
│                                          │
│   Nog geen account? Docent: registreer  │
│   Leerling: vraag een code aan je docent│
└─────────────────────────────────────────┘
```

**Logica:**
- Eén centrale login, met een **rolkeuze bovenaan** die de rest van het formulier subtiel kleurt (bijv. blauw-accent voor leerling, groen voor docent) zodat na inloggen direct het juiste dashboard opent — dit voorkomt een aparte "welke rol ben je"-vraag na login.
- **Leerlingaccounts worden niet zelf aangemaakt.** Docenten maken leerlingen aan (zie 3.2) en genereren een simpele inlogcode of QR-code — belangrijk voor jonge/laaggeletterde NT2-leerders die geen e-mailadres hebben. Alternatief: inloggen met een pictogram + korte pincode.
- Taalkeuze rechtsboven beïnvloedt alléén de interface-taal (bijv. Engels/Arabisch/Oekraïens als steuntaal voor absolute beginners), nooit de leerstof.
- Na login: automatische redirect naar het juiste dashboard op basis van rol, met een "onthoud mij"-optie (langere sessie, belangrijk op gedeelde schoolcomputers → dan juist afraden en standaard uitloggen na inactiviteit).

---

## 3. Docenten-dashboard

### 3.1 Hoofdnavigatie (docent)

Vaste zijbalk (desktop) / onderbalk (mobiel) met vier hoofdsecties:
`🏠 Overzicht | 👥 Leerlingen & Klassen | 📚 Woordenlijsten | 📊 Voortgang`

### 3.2 Scherm: Overzicht (dashboard-startpagina)

**Layout:**
```
┌───────────────────────────────────────────────┐
│ Welkom terug, [naam docent]                    │
├───────────────────────────────────────────────┤
│ [Kaart] Actieve klassen: 4    [Kaart] Leerlingen: 62 │
│ [Kaart] Deze week geoefend: 340x                │
├───────────────────────────────────────────────┤
│ Recente activiteit (mini-lijst)                │
│  • Fatima (A2) behaalde badge "Woordkampioen"  │
│  • Klas Alfa-1 rondde lijst "Boodschappen" af  │
├───────────────────────────────────────────────┤
│ Snelle acties:                                 │
│ [+ Nieuwe leerling] [+ Nieuwe woordenlijst]     │
│ [+ Nieuwe klas]                                │
└───────────────────────────────────────────────┘
```
**Logica:** dit scherm is een KPI-samenvatting die queries samenvoegt uit de leerlingen-, klassen- en voortgangsdata; geen bewerkfunctionaliteit, alleen signalering + doorklikken.

### 3.3 Scherm: Leerlingen & Klassen beheren

**Layout:** tabelweergave met filters bovenaan.
```
┌───────────────────────────────────────────────┐
│ Filter: [Klas ▾] [Niveau ▾] [Zoek leerling 🔍] │
│                              [+ Leerling toevoegen] │
├───────────────────────────────────────────────┤
│ Naam        Klas       Niveau   Punten  Streak │
│ Ahmed K.    Alfa-1     Alfa     120     🔥3    │
│ Olena V.    A2-ochtend A2       340     🔥12   │
│ ...                                             │
├───────────────────────────────────────────────┤
│ [Klik op leerling → detailpagina]              │
└───────────────────────────────────────────────┘
```
**Leerling toevoegen (modal/subpagina):**
- Naam, (optioneel) e-mail, niveau (Alfa/A1/A2/B1), klas-toewijzing (dropdown of "nieuwe klas maken"), automatisch gegenereerde inlogcode/QR.
- Bulk-import via CSV voor grotere groepen (bijv. bij start cursusjaar).

**Klas beheren:**
- Klas = simpele groepering (naam, niveau, lijst van leerlingen, gekoppelde woordenlijsten). Docent kan leerlingen slepen/verplaatsen tussen klassen.

**Leerling-detailpagina:** naam, niveau (aanpasbaar), voortgangsgrafiek, lijst gedeelde woordenlijsten met per-lijst score, badges-overzicht, mogelijkheid om niveau handmatig bij te stellen (differentiatie, zie hoofdstuk 5).

### 3.4 Scherm: Woordenlijsten beheren

**Layout:**
```
┌───────────────────────────────────────────────┐
│ [+ Nieuwe woordenlijst]     Zoek: [______]     │
├───────────────────────────────────────────────┤
│ 📘 Boodschappen doen   (A1)   Gedeeld met: 3 klassen │
│ 📗 In het ziekenhuis   (A2)   Gedeeld met: 1 klas    │
│ 📙 Familiewoorden      (Alfa) Nog niet gedeeld       │
└───────────────────────────────────────────────┘
```
**Woordenlijst aanmaken/bewerken (editor):**
```
Titel: [__________]   Niveau: [Alfa/A1/A2/B1 ▾]  Thema-icoon: [kies]

Woord (NL)     Vertaling*   Afbeelding    Audio
[appel   ]     [optioneel]  [upload/kies] [opnemen/genereren]
[+ woord toevoegen]

[Concept opslaan]  [Delen met...]
```
*Vertaling is optioneel en instelbaar per steuntaal — nuttig voor Alfa/A1-groepen met een gedeelde moedertaal, maar de kernvaardigheid blijft NL-NL koppeling (woord–plaatje–geluid) zodat de app taalonafhankelijk werkt.*

**Delen-flow:** knop "Delen met…" opent een kiezer met klassen én individuele leerlingen (checkbox-lijst), met optie "direct beschikbaar" of "inplannen vanaf [datum]" — handig om lesstof per week vrij te geven.

**Logica achter audio:** automatische uitspraak via text-to-speech (bijv. NL-stem) als standaard, met optie voor docent om een eigen opname te uploaden voor lastige woorden — belangrijk omdat TTS soms de klemtoon van leenwoorden verkeerd legt.

### 3.5 Scherm: Voortgang & inzicht

**Layout:**
```
┌───────────────────────────────────────────────┐
│ Klas: [A2-ochtend ▾]     Periode: [Deze maand▾]│
├───────────────────────────────────────────────┤
│ [Grafiek: gemiddelde score per week]           │
│ [Grafiek: meest foute woorden (top 10)]        │
├───────────────────────────────────────────────┤
│ Per leerling:                                  │
│ Naam      Geoefend  Nauwkeurigheid  Streak     │
│ Olena V.  85 keer   88%             🔥12       │
└───────────────────────────────────────────────┘
```
**Logica:** de "meest foute woorden"-widget is didactisch de belangrijkste: die vertelt de docent direct welke woorden klassikaal herhaald moeten worden. Exporteerbaar als PDF/CSV voor rapportage (bijv. richting inburgeringstraject).

---

## 4. Leerlingen-dashboard

### 4.1 Hoofdnavigatie (leerling)

Grote, iconische onderbalk (mobile-first):
`🏠 Start | 📚 Mijn lijsten | 🎮 Oefenen | 🏆 Badges`

### 4.2 Scherm: Start

```
┌───────────────────────────────────────────────┐
│ Hoi [naam]! 👋           [Punten: 340 ⭐]      │
│                          [Streak: 🔥 5 dagen]  │
├───────────────────────────────────────────────┤
│ Nieuw van je docent:                           │
│  [Kaart: "In het ziekenhuis" — 12 woorden]     │
│  [ Start ]                                     │
├───────────────────────────────────────────────┤
│ Ga verder waar je gebleven was:                │
│  [Kaart: "Boodschappen" — 60% klaar ▓▓▓░░]     │
├───────────────────────────────────────────────┤
│ [Grote knop: 🎲 Verrassingsoefening]           │
└───────────────────────────────────────────────┘
```
**Logica:** de startpagina is bewust een "wat nu"-scherm, geen menu — het kiest zelf de meest relevante volgende actie (nieuw materiaal > onafgemaakte lijst > herhaling van zwakke woorden), gebaseerd op een simpele prioriteitsregel, zodat de leerling niet hoeft na te denken over wát te doen.

### 4.3 Scherm: Mijn woordenlijsten

Twee tabbladen: **"Van mijn docent"** en **"Mijn eigen lijsten"**.

- *Van mijn docent*: read-only kaarten (titel, niveau-badge, aantal woorden, voortgangsbalk).
- *Mijn eigen lijsten*: leerling kan zelf lijsten maken via een vereenvoudigde versie van de docenteneditor (woord + plaatje uit picto-bibliotheek + automatische uitspraak; geen handmatige audio-upload nodig). Nuttig voor eigen woordenschat buiten de les (bijv. woorden van werk of straat).

**Layout eigen-lijst-editor (vereenvoudigd, groot lettertype):**
```
Titel van mijn lijst: [___________]
[+ Woord toevoegen]
  Woord: [______]  🔊 (automatisch)   🖼️ (kies plaatje)
[Opslaan]
```

### 4.4 Scherm: Oefenen — oefeningkiezer

Bij het openen van een lijst kiest de leerling (of de app kiest automatisch bij "Verrassingsoefening") uit oefenvormen, elk met een simpel icoon-kaartje:

```
┌───────────┬───────────┬───────────┬───────────┐
│  🗂️        │  ✅        │  ⌨️        │  🎧        │
│ Flashcards │ Meerkeuze │ Typen     │ Uitspraak │
└───────────┴───────────┴───────────┴───────────┘
```

**4.4.a Flashcards**
- Kaart toont plaatje + woord (of alleen plaatje, afhankelijk van niveau) → tik/swipe om om te draaien → toont woord + uitspraak-knop.
- Leerling beoordeelt zichzelf: "Wist ik" / "Nog oefenen" (spaced-repetition input, zie §5).

**4.4.b Meerkeuzevragen**
- Plaatje of gesproken woord centraal, 4 antwoordopties eronder (grote knoppen). Direct kleursignaal (groen/rood) + zacht geluidseffect. Fout antwoord: correcte optie licht op, woord wordt na de ronde herhaald.

**4.4.c Spelling/typen**
- Plaatje + audio, leerling typt het woord in een invoerveld met groot lettertype. Tolerantie-instelling voor kleine typfouts is aanpasbaar per niveau (zie hoofdstuk 5): bij Alfa/A1 wordt bijv. één letterfout nog als "bijna goed" (geel) gerekend i.p.v. fout.

**4.4.d Audio/uitspraak**
- App speelt woord af, leerling spreekt na (microfoon-knop) → speech-recognition vergelijkt uitspraak, geeft globale score (bijv. 3 sterren) — dit is bewust *indicatief*, niet keihard afgekeurd, om spreekangst te vermijden. Leerling kan eigen opname terugluisteren naast het voorbeeld.

**Oefenscherm — algemene layout tijdens een sessie:**
```
┌───────────────────────────────────────────────┐
│ ◀ Stoppen        Voortgang: ▓▓▓▓░░░░ 4/10      │
│                                                 │
│              [plaatje / woord / audio]         │
│                                                 │
│            [antwoordmogelijkheden]             │
│                                                 │
│           [+10 ⭐ animatie bij goed antwoord]   │
└───────────────────────────────────────────────┘
```

### 4.5 Scherm: Badges & gamification-overzicht

```
┌───────────────────────────────────────────────┐
│ Totaal: 340 ⭐        Huidige streak: 🔥5 dagen │
├───────────────────────────────────────────────┤
│ Badges behaald:      Badges te gaan:           │
│ 🏅 Eerste woorden     🔒 100 woorden geoefend   │
│ 🏅 5-daagse streak    🔒 Perfecte ronde x5      │
├───────────────────────────────────────────────┤
│ [Optioneel: klassikaal scorebord — aan/uit     │
│  te zetten door docent, altijd anoniem-optie]  │
└───────────────────────────────────────────────┘
```

---

## 5. Puntensysteem & differentiatie-logica

Dit is het hart van de motivatie-engine. Onderstaand een concreet, bouwbaar model.

### 5.1 Puntentoekenning (basis)

| Actie | Punten |
|---|---|
| Correct antwoord, 1e poging | +10 |
| Correct antwoord na fout (2e poging) | +5 |
| Correct antwoord, moeilijkere modus (typen/uitspraak) | +5 bonus |
| Volledige oefenronde afgerond | +20 bonus |
| Foutief woord bij herhaling alsnog goed | +15 (extra beloning voor "geleerd van fout") |
| Dagelijkse inlog/streak-dag | +5 |

**Waarom dit werkt didactisch:** de bonus op "geleerd van fout" (regel 5) stimuleert herhaling in plaats van vermijding van moeilijke woorden — belangrijk omdat NT2-leerders anders geneigd zijn lastige woorden te omzeilen.

### 5.2 Streaks

- Streak = aantal opeenvolgende dagen met minstens 1 afgeronde oefening (niet per se perfect).
- Bij gemiste dag: streak-freeze mogelijk (1x per week gratis, verdiend via punten) — voorkomt demotivatie bij één gemiste dag, wat vooral relevant is bij NT2-leerders met wisselende werk-/zorgroosters.

### 5.3 Badges (voorbeelden, uitbreidbaar systeem)

- Op basis van **volume** (25/100/500 woorden geoefend), **consistentie** (streaks), **precisie** (X rondes zonder fout), **breedte** (lijsten van elk niveau geoefend), **moed** (X keer de spreekoefening gebruikt — beloont juist de spannendste modus).
- Badges zijn nooit bestraffend van aard (geen "verlies" van badges) — sluit aan bij een groeimindset-aanpak die in NT2-didactiek gangbaar is.

### 5.4 Niveau-gebaseerde aanpassing (Alfa/A1/A2/B1)

Elke woordenlijst en oefening heeft een niveau-tag. Dit stuurt drie dingen aan:

1. **Contentcomplexiteit**: bij Alfa/A1 overwegend plaatje-woord-koppelingen en meerkeuze; typen en vrije spelling worden pas prominent vanaf A2; B1 introduceert langere zinnen/context in plaats van losse woorden.
2. **Feedbacksnelheid en -toon**: Alfa/A1 → onbeperkte bedenktijd, geen timer, extra visuele hints (plaatje blijft zichtbaar); A2/B1 → optionele timer-modus voor extra punten (uitdaging voor gevorderden), tekstuele hints i.p.v. plaatjes.
3. **Foutentolerantie**: spellingscontrole is niveau-afhankelijk strenger (zie 4.4.c) — dit voorkomt dat een Alfa-leerling afhaakt op detailfouten terwijl B1 juist op correcte spelling moet worden aangesproken.

**Technische implementatie-suggestie:** niveau als los attribuut op zowel `leerling` als `woordenlijst`/`oefening`; een simpele regel-engine (geen zware AI nodig) leest dit attribuut uit en kiest bijpassende UI-parameters (timer aan/uit, hinttype, foutmarge) uit een configuratietabel per niveau. Optioneel later uit te breiden met adaptieve moeilijkheid (bijv. op basis van score automatisch een niveau hoger/lager voorstellen aan de docent — mens blijft de beslisser, geen automatische promotie zonder goedkeuring).

---

## 6. Technologische stack — voorstel

Onderstaand een pragmatisch voorstel, met een lichtere en een uitgebreidere variant.

### 6.1 Aanbevolen aanpak: cross-platform web + mobiel vanuit één codebase

| Laag | Technologie | Waarom |
|---|---|---|
| Frontend (web + mobiel) | **React** (web) + **React Native / Expo** voor iOS/Android, of **Flutter** als alternatief | Herbruikbare componenten, grote community, goede toegankelijkheids-ondersteuning. Expo maakt snel itereren en offline-gebruik (belangrijk in klaslokalen met wisselend wifi) eenvoudiger. |
| State/dataflow | React Query / Zustand (of Redux Toolkit bij complexere state) | Overzichtelijk databeheer tussen dashboards. |
| Backend/API | **Node.js met NestJS** of **Django (Python)** | Beide bieden solide, snel op te zetten REST/GraphQL API's met goede authenticatie-modules; Django heeft sterke ingebouwde admin-tools wat handig is voor contentbeheer. |
| Database | **PostgreSQL** | Relationeel model past goed bij docent–klas–leerling–woordenlijst-structuur; goede ondersteuning voor rapportage-queries (voortgang). |
| Authenticatie | **Auth0** of eigen JWT-implementatie, met apart "lichte" login-flow (code/QR) voor leerlingen | Scheiding tussen volwaardige docentaccounts en vereenvoudigde leerlingtoegang. |
| Audio (uitspraak tonen) | **Text-to-Speech**: Google Cloud TTS of Azure Speech (goede Nederlandse stemmen) | Consistente, verstaanbare uitspraak zonder dat elke docent zelf moet inspreken. |
| Audio (uitspraak beoordelen) | **Speech-to-Text**: Azure Speech Services of Google Cloud Speech-to-Text | Voor de spreekoefening; geef bewust een indicatieve score, geen keiharde pass/fail. |
| Beeldmateriaal | Eigen picto-bibliotheek (bijv. gebaseerd op open-source pictogrammensets zoals ARASAAC, met toestemming/licentiecheck) + upload-optie voor docenten | Consistente, cultuurneutrale plaatjes zijn belangrijk bij NT2. |
| Hosting | **Vercel** (frontend) + **Render/Railway/AWS** (backend + database), of volledig op **AWS/Azure** bij schoolbrede uitrol | Vercel is snel voor front-end iteratie; overstap naar AWS/Azure ligt voor de hand bij opschaling naar meerdere scholen (compliance, AVG-hosting binnen de EU). |
| Analytics/voortgang | Eigen event-logging naar de database + dashboard-queries; evt. later uit te breiden met een BI-laag (Metabase) voor school-brede rapportages | Simpel beginnen, later uitbreidbaar. |

### 6.2 Lichtere / snellere MVP-variant

Voor een eerste pilot (bijv. binnen één taalschool) is een **Progressive Web App (PWA)** met **Next.js + Supabase** een aan te raden combinatie:
- Supabase geeft direct een Postgres-database, authenticatie én file-storage (voor audio/plaatjes) uit één pakket, wat de ontwikkeltijd fors verkort.
- Een PWA werkt op zowel telefoon als laptop via de browser (installeerbaar als app-icoon), zonder dat er meteen aparte iOS/Android-builds nodig zijn via de app stores — belangrijk om snel te kunnen testen met echte leerlingen/docenten voordat in een native app wordt geïnvesteerd.
- Zodra de MVP gevalideerd is, kan alsnog worden overgestapt naar React Native voor een volwaardige app-store-aanwezigheid, met hergebruik van veel React-componenten.

### 6.3 Aandachtspunten AVG/privacy

Omdat het om (mogelijk minderjarige) leerlingdata gaat: kies EU-hosting, minimaliseer verplichte persoonsgegevens (naam + niveau is vaak genoeg, e-mail optioneel), en zorg voor een verwerkersovereenkomst met gekozen clouddiensten (Supabase/AWS/Azure/Google bieden dit).

---

## 7. Globaal datamodel (vereenvoudigd)

```
Docent ──< Klas ──< Leerling
Docent ──< Woordenlijst >── Klas (gedeeld)
Woordenlijst ──< Woord (NL, vertaling, afbeelding, audio)
Leerling ──< Oefensessie >── Woordenlijst
Oefensessie ──< Antwoord (woord_id, correct?, poging_nr, modus)
Leerling ──< Badge (behaald_op)
Leerling: niveau, punten_totaal, streak_teller, laatste_actief
```

Dit model ondersteunt direct de belangrijkste rapportages (voortgang per leerling/klas, meest foute woorden) zonder complexe joins.

---

## 8. Volgende stappen (aanbeveling)

1. Klikbare prototype (bijv. in Figma) van de kernflows: inloggen → docent deelt lijst → leerling oefent → punten/badge verschijnen.
2. Korte pilot met één klas en één docent om de puntenbalans en niveau-instellingen te toetsen.
3. Vanaf pilot-feedback: MVP-stack (§6.2) uitbouwen naar de volledige stack (§6.1) indien opschaling gewenst is.
