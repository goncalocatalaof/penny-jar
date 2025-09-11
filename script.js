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

function initClient() {
  gapi.client.init({
    clientId: CLIENT_ID,
    scope: SCOPES,
    discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"]
  }).then(() => {
    return gapi.auth2.getAuthInstance().signIn();
  });
}

function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

function attachFormHandler(formId, sheetName) {
  const form = document.getElementById(formId);
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(form);
    const values = [
      formData.get('Date'),
      formData.get('Amount'),
      formData.get('Category'),
      formData.get('Comment')
    ];

    const params = {
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A:D`,   // use the correct sheet
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS"
    };

    const valueRangeBody = { values: [values] };

    gapi.client.sheets.spreadsheets.values.append(params, valueRangeBody).then(response => {
      alert("Data submitted to " + sheetName);
      form.reset();
    }, error => {
      console.error("Error:", error);
      alert("Failed to submit data.");
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  handleClientLoad();

  attachFormHandler("form-personal", "Personal");
  attachFormHandler("form-family", "Family");
  attachFormHandler("form-utilities", "Utilities");
});
