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

    // Attach all form handlers only after gapi is ready
    attachFormHandler("form-personal", "Personal");
    attachFormHandler("form-family", "Family");
    attachFormHandler("form-utilities", "Utilities");
  }).catch(err => {
    console.error("GAPI init error:", err);
  });
}

// Load gapi client and auth2
gapi.load('client:auth2', initClient);

// ============================
// 2. NAVIGATION LOGIC
// ============================
function navigate(viewId) {
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
}

// ============================
// 3. DOM CONTENT LOADED EVENTS
// ============================
document.addEventListener('DOMContentLoaded', () => {

  // 3a. Set default date to today for all date inputs
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

  // 3c. Amount input formatting (comma decimal)
  const amountInputs = document.querySelectorAll('.amount');
  amountInputs.forEach(input => {
    input.addEventListener('input', () => {
      let value = input.value;

      // Replace dot with comma
      value = value.replace('.', ',');

      // Allow only digits and one comma
      value = value
        .replace(/[^0-9,]/g, '')  // remove non-numeric/non-comma
        .replace(/,+/g, ',');     // collapse multiple commas

      // Limit to 2 decimal places
      if (value.includes(',')) {
        const [intPart, decimalPart] = value.split(',');
        value = intPart + ',' + decimalPart.slice(0, 2);
      }

      input.value = value;
    });
  });
});

// ============================
// 4. FORM SUBMISSION HANDLER
// ============================
function attachFormHandler(formId, sheetName) {
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

      // Gather form values
      const formData = new FormData(form);
      const values = [
        formData.get('Date'),
        formData.get('Amount').trim().replace(',', '.'), // normalize amount
        formData.get('Category'),
        formData.get('Comment')
      ];

      // Append values to Google Sheet
      const response = await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A:D`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: { values: [values] }
      });

      console.log("Sheets API response:", response);
      alert(`Data submitted to ${sheetName}`);
      form.reset();

    } catch (error) {
      console.error("Sheets API error:", error);
      alert("Failed to submit data.");
    }
  });
}
