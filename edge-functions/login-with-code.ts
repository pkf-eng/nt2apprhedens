// Edge Function: login-with-code
// Wisselt een leerling-inlogcode (bv. "FATIMA24") in voor een echte
// Supabase-sessie, zonder dat er ooit een wachtwoord in de browser-
// code hoeft te staan. De enige geheime sleutel (de service-role key)
// blijft hier server-side; de browser stuurt alleen de code.
//
// Deze versie draait al live in het Supabase-project "NT2 oefenapp"
// (functie-slug: login-with-code). Dit bestand is puur ter referentie/
// documentatie — pas de gedeployde versie aan als je wijzigingen wilt.
//
// verify_jwt staat bewust uit bij het deployen: dit endpoint IS de
// authenticatie (een leerling is per definitie nog niet ingelogd als
// hij zijn code intypt), en de code zelf werkt als het inloggeheim.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Alleen POST is toegestaan' }, 405);

  let code: string | undefined;
  try {
    const body = await req.json();
    code = body?.code;
  } catch {
    return json({ error: 'Ongeldige aanvraag' }, 400);
  }
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return json({ error: 'Vul een code in' }, 400);
  }
  const normalisedCode = code.trim().toUpperCase();

  // 1) Zoek het account op via de code (met de service-role key,
  //    die alle RLS-policies mag omzeilen)
  const accRes = await fetch(
    `${SUPABASE_URL}/rest/v1/accounts?login_code=eq.${encodeURIComponent(normalisedCode)}&role=eq.leerling&select=auth_user_id`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
  );
  const accRows = await accRes.json();
  const authUserId = accRows?.[0]?.auth_user_id;
  if (!accRes.ok || !authUserId) {
    return json({ error: 'Onbekende of ongeldige code' }, 401);
  }

  // 2) Haal het (synthetische) e-mailadres van die gebruiker op
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${authUserId}`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  const userData = await userRes.json();
  const email = userData?.email;
  if (!userRes.ok || !email) {
    return json({ error: 'Kon gebruiker niet vinden' }, 500);
  }

  // 3) Genereer server-side een magic-link-token (wordt nooit gemaild,
  //    we gebruiken alleen de token die erin zit)
  const linkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'magiclink', email }),
  });
  const linkData = await linkRes.json();
  const hashedToken = linkData?.hashed_token || linkData?.properties?.hashed_token;
  if (!linkRes.ok || !hashedToken) {
    return json({ error: 'Kon geen sessie voorbereiden' }, 500);
  }

  // 4) Wissel die token in voor een echte sessie (access + refresh token)
  const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', token_hash: hashedToken }),
  });
  const session = await verifyRes.json();
  if (!verifyRes.ok || !session?.access_token) {
    return json({ error: 'Kon sessie niet verifiëren' }, 500);
  }

  return json({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    user: session.user,
  });
});
