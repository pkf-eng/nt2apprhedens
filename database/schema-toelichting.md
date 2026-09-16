# Toelichting bij het databaseschema (`nt2-app-schema.sql`)

## 1. Relatie-overzicht

```
accounts (1) ──── (1) teachers ──< classes ──< class_students >── students
                                       │                              │
                                       │                              │
                              word_list_shares                  word_lists (eigen lijsten)
                                       │                              │
                                       └──────────< word_lists >──────┘
                                                        │
                                                     words
                                                        │
                                              practice_sessions ──< answers
                                                        │
                                                 point_events
                                                        │
                                              students.points_total (auto-bijgewerkt)

students ──< student_badges >── badges
```

**Kernkeuzes, kort toegelicht:**

- **Eén `accounts`-tabel, twee profieltabellen.** Login-logica (e-mail+wachtwoord vs. code/QR) hoort bij het account; naam, niveau en punten horen bij het rol-specifieke profiel. Dit voorkomt dubbele/overlappende kolommen en maakt het makkelijk om later een derde rol toe te voegen (bv. schoolbeheerder) zonder de kernstructuur te breken.
- **`word_lists` heeft één eigenaar-type.** De CHECK-constraint dwingt af dat een lijst óf van een docent óf van een leerling is — dit voorkomt "spookrijen" waarbij een lijst per ongeluk aan niemand of aan beiden hangt.
- **`point_events` is een ledger, geen simpele teller.** In plaats van alleen `students.points_total` te verhogen, wordt elke puntenmutatie apart vastgelegd met een reden (`puntreden`-enum). Dit levert automatisch een audit-trail op ("waarom heeft deze leerling 340 punten?") en maakt het triviaal om later nieuwe puntenregels toe te voegen zonder bestaande data te hoeven herberekenen. Een database-trigger houdt `students.points_total` synchroon, zodat de UI nog steeds met één snelle kolom kan werken.
- **`answers` staat los van `point_events`.** Antwoorden zijn de ruwe leerdata (belangrijk voor "meest foute woorden"-rapportages); punten zijn een afgeleide beloningslaag. Door ze te scheiden kan het puntensysteem later wijzigen zonder de leerdata aan te tasten.

## 2. Voorbeeldqueries voor het docenten-dashboard

### 2.1 Gemiddelde score per klas, per week (voortgangsscherm §3.5)

```sql
SELECT
  c.name                                  AS klas,
  date_trunc('week', ps.started_at)       AS week,
  round(
    100.0 * count(*) FILTER (WHERE a.is_correct) / count(*), 1
  )                                        AS nauwkeurigheid_pct
FROM practice_sessions ps
JOIN answers a         ON a.session_id = ps.session_id
JOIN class_students cs ON cs.student_id = ps.student_id
JOIN classes c         ON c.id = cs.class_id
WHERE c.id = $1
GROUP BY c.name, week
ORDER BY week;
```

### 2.2 Top-10 meest foute woorden binnen een klas

```sql
SELECT
  w.word_nl,
  count(*) FILTER (WHERE NOT a.is_correct) AS aantal_fout
FROM answers a
JOIN words w            ON w.id = a.word_id
JOIN practice_sessions ps ON ps.id = a.session_id
JOIN class_students cs   ON cs.student_id = ps.student_id
WHERE cs.class_id = $1
GROUP BY w.word_nl
ORDER BY aantal_fout DESC
LIMIT 10;
```

### 2.3 Welke woordenlijsten ziet een specifieke leerling? (gedeeld via klas óf direct)

```sql
SELECT DISTINCT wl.*
FROM word_lists wl
JOIN word_list_shares s ON s.word_list_id = wl.id
LEFT JOIN class_students cs ON cs.class_id = s.class_id
WHERE (s.student_id = $1 OR cs.student_id = $1)
  AND (s.available_from IS NULL OR s.available_from <= current_date);
```

### 2.4 Leerlingen met een streak die vandaag nog niet geoefend hebben (voor een herinnering)

```sql
SELECT full_name, streak_count
FROM students
WHERE streak_count > 0
  AND streak_last_date < current_date
  AND NOT streak_freeze_available;
```

## 3. Uitbreidingen die passen binnen dit schema

- **Adaptieve niveau-suggestie (§5.4):** een periodieke job kan op basis van `answers`-nauwkeurigheid per niveau een voorstel genereren, dat de docent handmatig goedkeurt door `students.niveau` bij te werken — geen schemawijziging nodig.
- **Meertalige steuntalen:** `words.translation` is nu één kolom; bij behoefte aan meerdere steuntalen tegelijk kan dit eenvoudig worden vervangen door een aparte `word_translations`-tabel (`word_id`, `taal_code`, `vertaling`).
- **Rapportage-export (PDF/CSV, §3.5):** vereist geen schemawijziging — dit is puur een leeslaag bovenop bovenstaande queries.
