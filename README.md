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
