// Edge Function: create-student
// Laat een ingelogde docent een nieuwe leerling aanmaken: maakt een
// echte Supabase Auth-gebruiker aan, plus de bijbehorende rijen in
// accounts/students/class_students, en genereert een leesbare
// login-code die de docent aan de leerling kan doorgeven.
//
// verify_jwt staat AAN: de aanroeper moet een geldig, ingelogd
// docent-sessietoken meesturen. We halen zelf uit dat token wie de
// docent is (i.p.v. dat te vertrouwen op basis van iets wat de
// client zelf meestuurt), zodat een leerling nooit als "gemaakt door
// een andere docent" geregistreerd kan worden dan wie echt is ingelogd.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function decodeJwtSub(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

function slugifyCode(name: string): string {
  const cleaned = name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // accenten weg
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();
  return (cleaned.slice(0, 8) || 'LEERLING');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Alleen POST is toegestaan' }, 405);

  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const callerAuthUserId = token ? decodeJwtSub(token) : null;
  if (!callerAuthUserId) return json({ error: 'Niet ingelogd' }, 401);

  let payload: { full_name?: string; niveau?: string; class_id?: string | null };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Ongeldige aanvraag' }, 400);
  }
  const fullName = (payload.full_name || '').trim();
  const niveau = payload.niveau;
  const classId = payload.class_id || null;
  const geldigeNiveaus = ['alfa', 'a1', 'a2', 'b1'];
  if (!fullName) return json({ error: 'Naam is verplicht' }, 400);
  if (!niveau || !geldigeNiveaus.includes(niveau)) return json({ error: 'Ongeldig niveau' }, 400);

  const svcHeaders = { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` };

  // 1) Bevestig dat de aanroeper echt een docent is, en zoek zijn account_id op
  const teacherAccRes = await fetch(
    `${SUPABASE_URL}/rest/v1/accounts?auth_user_id=eq.${callerAuthUserId}&role=eq.docent&select=id`,
    { headers: svcHeaders },
  );
  const teacherAccRows = await teacherAccRes.json();
  const teacherAccountId = teacherAccRows?.[0]?.id;
  if (!teacherAccRes.ok || !teacherAccountId) {
    return json({ error: 'Alleen docenten mogen leerlingen toevoegen' }, 403);
  }

  // Als er een klas is opgegeven: controleer dat die klas ook echt van deze docent is
  if (classId) {
    const clsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/classes?id=eq.${classId}&teacher_id=eq.${teacherAccountId}&select=id`,
      { headers: svcHeaders },
    );
    const clsRows = await clsRes.json();
    if (!clsRes.ok || !clsRows?.[0]) {
      return json({ error: 'Deze klas bestaat niet of is niet van jou' }, 403);
    }
  }

  // 2) Genereer een unieke, leesbare login-code (bv. FATIMA82)
  let loginCode = '';
  for (let poging = 0; poging < 6; poging++) {
    const kandidaat = slugifyCode(fullName) + String(Math.floor(10 + Math.random() * 90));
    const bestaatRes = await fetch(
      `${SUPABASE_URL}/rest/v1/accounts?login_code=eq.${encodeURIComponent(kandidaat)}&select=id`,
      { headers: svcHeaders },
    );
    const bestaatRows = await bestaatRes.json();
    if (bestaatRes.ok && (!bestaatRows || bestaatRows.length === 0)) {
      loginCode = kandidaat;
      break;
    }
  }
  if (!loginCode) return json({ error: 'Kon geen unieke code genereren, probeer opnieuw' }, 500);

  const syntheticEmail = `${loginCode.toLowerCase()}@leerling.taalmaat.app`;

  // 3) Maak de echte Supabase Auth-gebruiker aan
  const createUserRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { ...svcHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: syntheticEmail,
      email_confirm: true,
      password: crypto.randomUUID(), // nooit gebruikt: leerlingen loggen in via de code, niet via wachtwoord
      user_metadata: { full_name: fullName, role: 'leerling' },
    }),
  });
  const newUser = await createUserRes.json();
  if (!createUserRes.ok || !newUser?.id) {
    return json({ error: 'Kon geen Auth-gebruiker aanmaken', details: newUser }, 500);
  }

  // 4) accounts-rij
  const accInsertRes = await fetch(`${SUPABASE_URL}/rest/v1/accounts`, {
    method: 'POST',
    headers: { ...svcHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify([{ role: 'leerling', login_code: loginCode, auth_user_id: newUser.id }]),
  });
  const accRows = await accInsertRes.json();
  const newAccountId = accRows?.[0]?.id;
  if (!accInsertRes.ok || !newAccountId) {
    return json({ error: 'Kon accountrij niet aanmaken', details: accRows }, 500);
  }

  // 5) students-rij
  const studentInsertRes = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
    method: 'POST',
    headers: { ...svcHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify([{
      account_id: newAccountId, full_name: fullName, niveau,
      points_total: 0, streak_count: 0, created_by_teacher_id: teacherAccountId,
    }]),
  });
  if (!studentInsertRes.ok) {
    return json({ error: 'Kon leerlingprofiel niet aanmaken', details: await studentInsertRes.json() }, 500);
  }

  // 6) optioneel: koppel aan een klas
  if (classId) {
    await fetch(`${SUPABASE_URL}/rest/v1/class_students`, {
      method: 'POST',
      headers: { ...svcHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify([{ class_id: classId, student_id: newAccountId }]),
    });
  }

  return json({ full_name: fullName, login_code: loginCode });
});
