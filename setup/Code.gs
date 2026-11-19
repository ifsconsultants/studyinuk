const columns = ['submission_id','submitted_at','full_name','email','phone_full','country_code','phone',
  'country_of_residence','preferred_intake','highest_qualification','qualification_year','preferred_course',
  'budget_range','contact_method','contact_time','consent_contact','consent_marketing','utm_source','utm_medium',
  'utm_campaign','utm_term','utm_content','gclid','fbclid','li_fat_id','lead_channel','landing_page_url','referrer'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const request = JSON.parse(e.postData.contents);
    const settings = PropertiesService.getScriptProperties();
    const secret = settings.getProperty('LEAD_SECRET');
    if (!secret || request.secret !== secret || !request.lead.submission_id) return result(false);
    lock.waitLock(10000);
    const book = SpreadsheetApp.openById(settings.getProperty('SHEET_ID'));
    const sheet = book.getSheetByName('UK 2027 Leads') || book.insertSheet('UK 2027 Leads');
    const width = sheet.getMaxColumns();
    if (width < columns.length) sheet.insertColumnsAfter(width, columns.length - width);
    const last = sheet.getLastRow();
    if (!last) sheet.appendRow(columns);
    if (last > 1 && sheet.getRange(2,1,last-1,1).createTextFinder(request.lead.submission_id)
        .matchEntireCell(true).findNext()) return result(true);
    const row = columns.map(function(key) {
      const value = String(request.lead[key] || '');
      return /^[\s]*[=+@-]/.test(value) ? "'" + value : value;
    });
    sheet.getRange(sheet.getLastRow()+1,1,1,row.length).setNumberFormat('@').setValues([row]);
    SpreadsheetApp.flush();
    return result(true);
  } catch (error) {
    return result(false);
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
function result(saved) {
  return ContentService.createTextOutput(JSON.stringify({saved:saved})).setMimeType(ContentService.MimeType.JSON);
}
