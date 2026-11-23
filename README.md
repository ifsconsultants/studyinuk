# UK 2027 counselling enquiries

1. Extract this ZIP. Upload public/, netlify.toml and this README to the root of your GitHub repository. For an existing deployment, replace public/index.html and netlify.toml with the included versions.
2. Import the repository into Netlify, or use your existing connected Netlify project. Use public as the publish directory and leave the build command empty.
3. In your Netlify project open Forms and enable form detection. Deploy again after enabling it.
4. Submit one enquiry on the live URL, then open Forms → uk-2027-enquiry to view the submitted details. The form keeps contact consent, optional marketing consent and campaign attribution with each enquiry.

No environment variables are required for form delivery.

Appointment requests appear in uk-2027-enquiry. Look for request_type and preferred_appointment_ist. Contact the student to confirm the time.

## Live Google reviews

The reviews section loads the latest Google reviews from `/api/reviews` (netlify/functions/reviews.mjs). Until it is configured, the page shows the reviews already written into index.html.

1. In Google Cloud Console, create or choose a project with billing enabled, enable **Places API (New)** and create an API key. Restrict the key to Places API (New).
2. Find the IFS Vizag Place ID with Google's Place ID Finder (search for the business name).
3. In Netlify open Site configuration → Environment variables and add `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACE_ID`, then redeploy.

Google returns up to 5 reviews per request, and the page shows them newest first. Responses are cached for up to 6 hours, so new reviews can take that long to appear.

## WhatsApp alert for every new enquiry

netlify/functions/submission-created.mjs runs automatically after every genuine (non-spam) form submission and sends the student's details to your WhatsApp. Set up one option in Netlify → Site configuration → Environment variables, then redeploy.

**Option A: CallMeBot (free, about 2 minutes)**
1. Save +34 694 29 84 96 in your phone's contacts (check callmebot.com for the current number).
2. From the WhatsApp number that should receive alerts, send it: `I allow callmebot to send me messages`
3. It replies with your API key.
4. Add `CALLMEBOT_PHONE` (your number with country code, digits only, e.g. 917036319256) and `CALLMEBOT_APIKEY`.

**Option B: WhatsApp Cloud API (Meta, official)**
1. In Meta Business Suite, set up WhatsApp Business Platform with a sender number.
2. Create and get approval for a Utility template named `new_lead` with this body:
   `New UK enquiry: {{1}}. Phone: {{2}}. Email: {{3}}. Course: {{4}}. Intake: {{5}}. Request: {{6}}`
3. Add `WHATSAPP_TOKEN` (a permanent System User token), `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_TO` (your number, digits only). Optional: `WHATSAPP_TEMPLATE`, `WHATSAPP_TEMPLATE_LANG`.

If both are set, Option B is used. Enquiries are always saved in Netlify Forms even if an alert fails; check Logs → Functions → submission-created for errors.
