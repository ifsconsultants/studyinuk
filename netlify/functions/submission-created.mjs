// Sends you a WhatsApp alert for every new enquiry.
// Netlify runs a function named "submission-created" automatically after each
// verified (non-spam) Netlify Forms submission. Nothing on the page needs to call it.
//
// Configure ONE of these in Netlify → Site configuration → Environment variables:
//
// Option A: CallMeBot (free, quick, messages only your own number)
//   CALLMEBOT_PHONE    your WhatsApp number with country code, digits only, e.g. 917036319256
//   CALLMEBOT_APIKEY   the API key CallMeBot sends you on WhatsApp
//
// Option B: WhatsApp Cloud API (Meta, official)
//   WHATSAPP_TOKEN            permanent access token (System User token)
//   WHATSAPP_PHONE_NUMBER_ID  the sender's Phone number ID from the WhatsApp Manager
//   WHATSAPP_TO               your number with country code, digits only, e.g. 917036319256
//   WHATSAPP_TEMPLATE         approved template name (default: new_lead)
//   WHATSAPP_TEMPLATE_LANG    template language code (default: en)
//   The template body must have 6 variables:
//   New UK enquiry: {{1}}. Phone: {{2}}. Email: {{3}}. Course: {{4}}. Intake: {{5}}. Request: {{6}}

const FORM = "uk-2027-enquiry";

const clean = (v, max = 120) =>
  String(v ?? "").replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, max) || "-";

function lines(d) {
  const digits = String(d.phone_full || "").replace(/\D/g, "");
  const out = [
    "🎓 *New UK 2027 enquiry*",
    "",
    `*Name:* ${clean(d.full_name)}`,
    `*Phone:* ${clean(d.phone_full || d.phone)}`,
    `*Email:* ${clean(d.email)}`,
    `*Request:* ${clean(d.request_type || "General enquiry")}`
  ];
  if (d.preferred_appointment_ist) out.push(`*Appointment (IST):* ${clean(d.preferred_appointment_ist).replace("T", " ")}`);
  out.push(
    `*Course:* ${clean(d.preferred_course)}`,
    `*Intake:* ${clean(d.preferred_intake)}`,
    `*Qualification:* ${clean(d.highest_qualification)} ${d.qualification_year ? "(" + clean(d.qualification_year) + ")" : ""}`.trim(),
    `*Country:* ${clean(d.country_of_residence)}`,
    `*Contact via:* ${clean(d.contact_method)}, ${clean(d.contact_time)}`,
    `*Source:* ${clean(d.lead_channel || d.utm_source || "direct")}`
  );
  if (digits.length >= 8) out.push("", `Chat now: https://wa.me/${digits}`);
  return out.join("\n");
}

async function viaCallMeBot(d, phone, apikey) {
  const url = "https://api.callmebot.com/whatsapp.php?" +
    new URLSearchParams({ phone, apikey, text: lines(d) }).toString();
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const body = await res.text();
  if (!res.ok || /error|invalid/i.test(body.slice(0, 300))) throw new Error(`CallMeBot ${res.status}: ${body.slice(0, 200)}`);
}

async function viaCloudApi(d, env) {
  const params = [
    d.full_name, d.phone_full || d.phone, d.email, d.preferred_course,
    d.preferred_intake,
    (d.request_type || "General enquiry") + (d.preferred_appointment_ist ? " at " + String(d.preferred_appointment_ist).replace("T", " ") + " IST" : "")
  ].map(v => ({ type: "text", text: clean(v, 200) }));
  const res = await fetch(`https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: String(env.WHATSAPP_TO).replace(/\D/g, ""),
      type: "template",
      template: {
        name: env.WHATSAPP_TEMPLATE || "new_lead",
        language: { code: env.WHATSAPP_TEMPLATE_LANG || "en" },
        components: [{ type: "body", parameters: params }]
      }
    }),
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) throw new Error(`WhatsApp Cloud API ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

export const handler = async (event) => {
  let payload;
  try { payload = JSON.parse(event.body).payload; } catch { return { statusCode: 200 }; }
  if (!payload || payload.form_name !== FORM) return { statusCode: 200 };
  const d = payload.data || {};
  const env = process.env;
  try {
    if (env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_TO) await viaCloudApi(d, env);
    else if (env.CALLMEBOT_PHONE && env.CALLMEBOT_APIKEY) await viaCallMeBot(d, env.CALLMEBOT_PHONE.replace(/\D/g, ""), env.CALLMEBOT_APIKEY);
    else console.log("WhatsApp alert skipped: no WhatsApp settings configured");
  } catch (err) {
    // The enquiry is already saved in Netlify Forms; only the alert failed.
    console.error("WhatsApp alert failed:", err.message);
  }
  return { statusCode: 200 };
};
