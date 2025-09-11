// ============================
// CONFIGURATION
// ============================
const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com'; // Replace with your OAuth Client ID
const SHEET_ID = 'YOUR_SHEET_ID'; // Replace with your Google Sheet ID
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let gapiInitialized = false;

// ============================
// 1. GOOGLE API INITIALIZATION
// ============================
function initClient() {
  gapi.client.init({
    clientId: CLIENT_ID,
    scope: SCOPES,
    discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"]
  }).then(() => {
    console.log("GAPI initialized");
    gapiInitialized = true;

    // Attach handlers for all forms AFTER gapi is ready
    attachFormHandler("form-personal");
    attachFormHandler("form-family");
    attachFormHandler("form-utilities");

  }).catch(err => {
    console.error("GAPI init error:", err);
  });
}

// Load gapi client & auth2
gapi.load('client:auth2', initClient);

// ============================
// 2. NAVIGATION LOGIC
// ============================
function navigate(viewId) {
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
}

// ============================
// 3. DOM READY EVENTS
// ============================
document.addEventListener('DOMContentLoaded', () => {

  // 3a. Set default date to today
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(input => input.value = today);

  // 3b. Category selection logic
  const categories = document.querySelectorAll(".category");
  categories.forEach(category => {
    category.addEventListener("click", () => {
      categories.forEach(cat => cat.classList.remove("selected"));
      category.classList.add("selected");
    });
  });

  // 3c. Amount input formatting (comma decimal, max 2 decimals)
  const amountInputs = document.querySelectorAll('.amount');
  amountInputs.forEach(input => {
    input.addEventListener('input', () => {
      let value = input.value;
      value = value.replace('.', ','); // replace dot with comma
      value = value.replace(/[^0-9,]/g, '').replace(/,+/g, ','); // only digits + one comma

      if (value.includes(',')) {
        const [intPart, decimalPart] = value.split(',');
        value = intPart + ',' + decimalPart.slice(0, 2); // max 2 decimals
      }

      input.value = value;
    });
  });
});

// ============================
// 4. FORM SUBMISSION HANDLER
// ============================
function attachFormHandler(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!gapiInitialized) {
      alert("Google API not initialized yet. Please wait a few seconds.");
      return;
    }

    try {
      // Ensure user is signed in
      const authInstance = gapi.auth2.getAuthInstance();
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }

      // Collect form data
      const formData = new FormData(form);
      const values = [
        formData.get('Date'),
        formData.get('Amount').trim().replace(',', '.'), // normalize amount
        formData.get('Category'),
        formData.get('Comment'),
        formId // optional: track which form submitted
      ];

      console.log(`Submitting values from ${formId}:`, values);

      // Append to "penny" sheet
      const response = await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `penny!A:E`, // all forms write to "penny" sheet
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: { values: [values] }
      });

      console.log("Sheets API response:", response);
      alert(`Data submitted from ${formId} to penny sheet`);
      form.reset();

    } catch (error) {
      console.error("Sheets API error:", error);
      alert("Failed to submit data. Check console for details.");
    }
  });
}
