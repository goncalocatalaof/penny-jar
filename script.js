// Navigation logic: show selected view and hide others
function navigate(viewId) {
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById(viewId).classList.add('active');
}

// Set default date to today in all date inputs
window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(input => {
    input.value = today;
  });
});

// Category selection logic
document.addEventListener("DOMContentLoaded", function () {
  const categories = document.querySelectorAll(".category");

  categories.forEach(category => {
    category.addEventListener("click", () => {
      // Remove 'selected' from all categories
      categories.forEach(cat => cat.classList.remove("selected"));
      // Add 'selected' to the clicked one
      category.classList.add("selected");
    });
  });
});

  // Select all inputs with class "amount-input"
  const amountInputs = document.querySelectorAll('.amount');

  amountInputs.forEach(input => {
    input.addEventListener('input', () => {
      let value = input.value;

      // Replace dot with comma
      value = value.replace('.', ',');

      // Allow only digits and one comma
      value = value
        .replace(/[^0-9,]/g, '')    // remove non-numeric/non-comma
        .replace(/,+/g, ',');       // collapse multiple commas

      // Limit to 2 decimal places
      if (value.includes(',')) {
        const [intPart, decimalPart] = value.split(',');
        value = intPart + ',' + decimalPart.slice(0, 2);
      }

      input.value = value;
    });
  });

  // Optional: convert values on form submit
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const inputs = form.querySelectorAll('.amount');
      inputs.forEach(input => {
        const raw = input.value.trim().replace(',', '.');
        const normalized = parseFloat(raw).toFixed(2);

        console.log(`Submitting ${normalized} from input:`, input);
        // Submit normalized to your backend or store
      });
    });
  });

// Set default date to today in all date inputs
window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(input => {
    input.value = today;
  });
});

// Category selection logic
document.addEventListener("DOMContentLoaded", function () {
  const categories = document.querySelectorAll(".category");

  categories.forEach(category => {
    category.addEventListener("click", () => {
      // Remove 'selected' from all categories
      categories.forEach(cat => cat.classList.remove("selected"));
      // Add 'selected' to the clicked one
      category.classList.add("selected");
    });
  });
});

//Google Sheets API integration
const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const SHEET_ID = 'YOUR_SHEET_ID';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let gapiInitialized = false;

function initClient() {
  gapi.client.init({
    clientId: CLIENT_ID,
    scope: SCOPES,
    discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"]
  }).then(() => {
    console.log("GAPI initialized");
    gapiInitialized = true;
  }, err => {
    console.error("GAPI init error:", err);
  });
}

gapi.load('client:auth2', initClient);

function attachFormHandler(formId, sheetName) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!gapiInitialized) {
      alert("Google API not initialized yet. Try again in a few seconds.");
      return;
    }

    try {
      const authInstance = gapi.auth2.getAuthInstance();
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }

      const formData = new FormData(form);
      const values = [
        formData.get('Date'),
        formData.get('Amount'),
        formData.get('Category'),
        formData.get('Comment')
      ];

      const response = await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A:D`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: { values: [values] }
      });

      console.log("Sheets API response:", response);
      alert("Data submitted to " + sheetName);
      form.reset();

    } catch (error) {
      console.error("Sheets API error:", error);
      alert("Failed to submit data.");
    }
  });
}

// Wait until DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  attachFormHandler("form-personal", "Personal");
});
