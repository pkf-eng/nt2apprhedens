-- ============================================================
--  TaalMaat — Databaseschema (PostgreSQL 15+)
--  Aansluitend op het functioneel ontwerp §7 en het techstack-
--  voorstel §6 (PostgreSQL als relationele database).
-- ============================================================

-- ---------- ENUM-TYPES ----------
CREATE TYPE account_role      AS ENUM ('docent', 'leerling');
CREATE TYPE nt2_niveau        AS ENUM ('alfa', 'a1', 'a2', 'b1');
CREATE TYPE lijst_eigenaar    AS ENUM ('docent', 'leerling');
CREATE TYPE oefen_modus       AS ENUM ('flashcards', 'meerkeuze', 'typen', 'uitspraak');
CREATE TYPE badge_criterium   AS ENUM ('volume', 'streak', 'precisie', 'breedte', 'moed');
CREATE TYPE puntreden         AS ENUM (
  'goed_1e_poging', 'goed_2e_poging', 'modus_bonus',
  'sessie_afgerond', 'herleerd_woord', 'dagelijkse_streak'
);

-- ============================================================
--  1. ACCOUNTS & PROFIELEN
-- ============================================================

-- Eén centrale accounts-tabel voor de gedeelde inlogpagina (§2.1).
-- Docenten loggen in met e-mail+wachtwoord, leerlingen met een
-- eenvoudige code/QR — vandaar dat beide inlogvelden nullable zijn
-- en een CHECK-constraint afdwingt dat het juiste veld gevuld is.
CREATE TABLE accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role            account_role NOT NULL,
  email           CITEXT UNIQUE,               -- alleen voor docenten
  password_hash   TEXT,                        -- alleen voor docenten
  login_code      VARCHAR(12) UNIQUE,          -- alleen voor leerlingen
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at  TIMESTAMPTZ,
  CONSTRAINT chk_docent_credentials
    CHECK (role <> 'docent' OR (email IS NOT NULL AND password_hash IS NOT NULL)),
  CONSTRAINT chk_leerling_credentials
    CHECK (role <> 'leerling' OR login_code IS NOT NULL)
);

CREATE TABLE teachers (
  account_id   UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  school_name  TEXT
);

CREATE TABLE students (
  account_id           UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  full_name            TEXT NOT NULL,
  niveau               nt2_niveau NOT NULL,
  points_total         INTEGER NOT NULL DEFAULT 0,
  streak_count         INTEGER NOT NULL DEFAULT 0,
  streak_last_date     DATE,
  streak_freeze_available BOOLEAN NOT NULL DEFAULT false,
  created_by_teacher_id UUID REFERENCES teachers(account_id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
--  2. KLASSEN
-- ============================================================

CREATE TABLE classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES teachers(account_id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  niveau      nt2_niveau,               -- richt-niveau van de klas (indicatief)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Veel-op-veel: een leerling kan in principe in meerdere groepen zitten
-- (bv. een reguliere klas + een extra oefengroep).
CREATE TABLE class_students (
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES students(account_id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, student_id)
);

-- ============================================================
--  3. WOORDENLIJSTEN & WOORDEN
-- ============================================================

-- Zowel docenten als leerlingen kunnen lijsten maken (§3.4 / §4.3).
-- Precies één van teacher_id/student_id is gevuld, afhankelijk van owner_type.
CREATE TABLE word_lists (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type   lijst_eigenaar NOT NULL,
  teacher_id   UUID REFERENCES teachers(account_id) ON DELETE CASCADE,
  student_id   UUID REFERENCES students(account_id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  niveau       nt2_niveau NOT NULL,
  theme_icon   TEXT,                    -- bv. emoji-key: "🛒"
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_owner_consistentie CHECK (
    (owner_type = 'docent'   AND teacher_id IS NOT NULL AND student_id IS NULL) OR
    (owner_type = 'leerling' AND student_id IS NOT NULL AND teacher_id IS NULL)
  )
);

CREATE TABLE words (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_list_id   UUID NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
  word_nl        TEXT NOT NULL,          -- bv. "de appel"
  translation    TEXT,                   -- optionele steuntaal-vertaling
  image_url      TEXT,
  audio_url      TEXT,                   -- eigen opname docent; anders TTS at runtime
  sort_order     INTEGER NOT NULL DEFAULT 0
);

-- Delen van docent-lijsten met klassen en/of individuele leerlingen (§3.4),
-- inclusief het "inplannen vanaf datum"-scenario.
CREATE TABLE word_list_shares (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_list_id          UUID NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
  class_id              UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id            UUID REFERENCES students(account_id) ON DELETE CASCADE,
  shared_by_teacher_id  UUID NOT NULL REFERENCES teachers(account_id),
  shared_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  available_from        DATE,           -- NULL = direct beschikbaar
  CONSTRAINT chk_share_doelwit CHECK (
    (class_id IS NOT NULL AND student_id IS NULL) OR
    (student_id IS NOT NULL AND class_id IS NULL)
  )
);

-- ============================================================
--  4. OEFENSESSIES & ANTWOORDEN
-- ============================================================

CREATE TABLE practice_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(account_id) ON DELETE CASCADE,
  word_list_id    UUID NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
  mode            oefen_modus NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  points_earned   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE answers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  word_id            UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  attempt_number     INTEGER NOT NULL DEFAULT 1,
  is_correct         BOOLEAN NOT NULL,
  response_time_ms   INTEGER,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
--  5. PUNTEN, STREAKS & BADGES
-- ============================================================

-- Puntenledger: elke mutatie apart vastgelegd (i.p.v. alleen een teller
-- bijwerken) zodat punten_total altijd herleidbaar en controleerbaar is,
-- en de docent exact kan zien waar punten vandaan kwamen (§5.1).
CREATE TABLE point_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES students(account_id) ON DELETE CASCADE,
  session_id   UUID REFERENCES practice_sessions(id) ON DELETE SET NULL,
  points       INTEGER NOT NULL,
  reason       puntreden NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE badges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,     -- bv. "streak_5"
  name            TEXT NOT NULL,
  description     TEXT,
  icon            TEXT,
  criteria_type   badge_criterium NOT NULL,
  criteria_value  INTEGER NOT NULL          -- bv. 5 (dagen), 100 (woorden)
);

CREATE TABLE student_badges (
  student_id  UUID NOT NULL REFERENCES students(account_id) ON DELETE CASCADE,
  badge_id    UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, badge_id)
);

-- ============================================================
--  6. INDEXEN
--  (gericht op de rapportages uit §3.5 en de dagelijkse leerling-flows)
-- ============================================================

CREATE INDEX idx_students_niveau            ON students(niveau);
CREATE INDEX idx_word_lists_niveau          ON word_lists(niveau);
CREATE INDEX idx_class_students_student     ON class_students(student_id);
CREATE INDEX idx_shares_class               ON word_list_shares(class_id);
CREATE INDEX idx_shares_student             ON word_list_shares(student_id);
CREATE INDEX idx_sessions_student_started   ON practice_sessions(student_id, started_at DESC);
CREATE INDEX idx_answers_session            ON answers(session_id);
CREATE INDEX idx_answers_word_correct       ON answers(word_id, is_correct);
CREATE INDEX idx_point_events_student_time  ON point_events(student_id, created_at DESC);

-- ============================================================
--  7. TRIGGER: punten_total op students automatisch bijwerken
--  (houdt de snelle "punten-badge" in de UI in sync met de ledger)
-- ============================================================

CREATE OR REPLACE FUNCTION fn_apply_point_event()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE students
  SET points_total = points_total + NEW.points
  WHERE account_id = NEW.student_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_apply_point_event
AFTER INSERT ON point_events
FOR EACH ROW
EXECUTE FUNCTION fn_apply_point_event();
