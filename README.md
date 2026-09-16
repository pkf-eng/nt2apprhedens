# TaalMaat Rhedens Dieren

Een NT2-leerapp (Nederlands als Tweede Taal) voor docenten en leerlingen, gebouwd als
klikbaar HTML-prototype met een echte Supabase-database erachter.

## Inhoud van deze repository

```
app/                  Het volledige prototype (index.html) — open dit bestand in
                       een browser, of host het ergens statisch (Netlify, Vercel,
                       GitHub Pages, etc.)
database/
  schema.sql           Het volledige PostgreSQL-schema (tabellen, RLS-policies,
                       triggers voor punten/streaks)
  schema-toelichting.md  Uitleg bij het schema + voorbeeldqueries voor rapportages
edge-functions/
  login-with-code.ts   Wisselt een leerling-inlogcode in voor een echte sessie,
                       zonder wachtwoord in de browsercode
  create-student.ts    Laat een ingelogde docent een nieuwe leerling aanmaken
docs/
  functioneel-ontwerp.md  Het oorspronkelijke functioneel ontwerp van de app
```

## Techstack

- **Frontend:** één self-contained HTML-bestand (vanilla JS, geen build-stap nodig)
- **Backend:** [Supabase](https://supabase.com) — PostgreSQL + Auth + Realtime + Edge Functions
- **Realtime:** het scorebord gebruikt Supabase Realtime (`postgres_changes`) zodat
  leerlingen elkaars scores live zien veranderen

## Zelf aan de slag

1. Maak een eigen Supabase-project aan.
2. Voer `database/schema.sql` uit in de SQL Editor van dat project.
3. Deploy de twee Edge Functions uit `edge-functions/` (via de Supabase CLI of dashboard).
4. Vervang in `app/index.html` de constanten `SUPABASE_URL` en `SUPABASE_ANON_KEY`
   bovenaan het `<script>`-blok door die van jouw eigen project.
5. Open `app/index.html` in een browser, of host het statisch.

De `SUPABASE_ANON_KEY` in `index.html` is bewust geen geheim — dat is de publieke
sleutel die hoort bij Row Level Security; alle echte beveiliging zit in de
RLS-policies in `schema.sql`, niet in het verborgen houden van deze key.

## Belangrijkste functionaliteit

**Docent:** leerlingen en klassen beheren (aanmaken, bewerken, filteren, zoeken,
opmerkingen plaatsen), woordenlijsten aanmaken/bewerken/delen (incl. bulk-plakken
en PDF-import), voortgang inzien.

**Leerling:** gedeelde en eigen woordenlijsten, oefenen via Meerkeuze/Flashcards/Typen
met een zelf te kiezen moeilijkheidsgraad (Makkelijk/Gemiddeld/Moeilijk), punten en
streaks die automatisch worden bijgehouden via database-triggers, een live scorebord,
en badges.

**Niveaus:** Alfa/A1/A2/B1, met een verwijzing naar de vergelijkbare Nederlandse
referentieniveaus (1F ≈ A2, 2F ≈ B1), volgens de vergelijking van het Raamwerk NT2.
