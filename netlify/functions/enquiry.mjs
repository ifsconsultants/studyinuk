const fields = [
  'full_name','email','country_code','phone','country_of_residence','preferred_intake',
  'highest_qualification','qualification_year','preferred_course','budget_range','contact_method',
  'contact_time','consent_contact','consent_marketing','utm_source','utm_medium','utm_campaign',
  'utm_term','utm_content','gclid','fbclid','li_fat_id','lead_channel','landing_page_url','referrer'
];

export const config = { path: "/api/enquiry" };

function reply(status, saved = false, headers = {}) {
  return Response.json({ saved }, {
    status,
    headers: { "Cache-Control": "no-store", ...headers }
  });
}

export default async function enquiry(request) {
  if (request.method !== "POST") return reply(405, false, { Allow: "POST" });
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return reply(415);
  }
  let input;
  try {
    input = await request.json();
  } catch {
    return reply(400);
  }
  if (!input || typeof input !== 'object' || input.company_website ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(input.submission_id)) {
    return reply(400);
  }
  const lead = {};
  for (const field of fields) {
    const value = input[field] ?? '';
    if (typeof value !== 'string' || value.length > 4096) return reply(400);
    lead[field] = value.trim();
  }
  const prefix = lead.country_code === 'other' ? '' : lead.country_code;
  const digits = lead.phone.replace(/\D/g,'');
  if (lead.full_name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email) ||
      !/^(other|\+[1-9]\d{0,2})$/.test(lead.country_code) || !/^\+?[\d ()-]+$/.test(lead.phone) ||
      digits.length < 6 || (prefix + digits).replace(/\D/g,'').length > 15 ||
      (lead.qualification_year && !/^(198\d|199\d|20[01]\d|202[0-7])$/.test(lead.qualification_year)) ||
      lead.consent_contact !== 'yes') return reply(400);
  lead.phone_full = (prefix || '+') + digits;
  lead.consent_marketing = lead.consent_marketing === 'yes' ? 'yes' : 'no';
  lead.submitted_at = new Date().toISOString();
  lead.submission_id = input.submission_id;
  const {SHEETS_WEB_APP_URL:url, LEAD_SECRET:secret} = process.env;
  if (!url || !secret) return reply(503);
  try {
    const upstream = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({secret,lead}), signal:AbortSignal.timeout(20000) });
    if (upstream.ok && (await upstream.json()).saved === true) return reply(200, true);
  } catch { /* Delivery may have timed out. The sheet deduplicates retries by ID. */ }
  return reply(502);
};
