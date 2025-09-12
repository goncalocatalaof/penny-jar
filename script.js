// ============================
// 1. NAVIGATION LOGIC
// ============================
function navigate(viewId) {
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
}

// ============================
// 2. DOM READY EVENTS
// ============================
document.addEventListener('DOMContentLoaded', () => {

  // 2a. Set default date to today
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(input => input.value = today);

  // 2b. Category selection logic
  const categories = document.querySelectorAll(".category");
  categories.forEach(category => {
    category.addEventListener("click", () => {
      categories.forEach(cat => cat.classList.remove("selected"));
      category.classList.add("selected");
    });
  });

  // 2c. Amount input formatting (comma decimal, max 2 decimals)
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

  // 2d. Attach all forms to submit handler
  attachFormHandler("form-personal");
  attachFormHandler("form-family");
  attachFormHandler("form-utilities");

});

// ============================
// 3. FORM SUBMISSION HANDLER
// ============================
function attachFormHandler(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

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

    try {
      // Send data to Vercel serverless function
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Data submitted from ${formId} to penny sheet`);
        form.reset();
      } else {
        alert("Failed to submit: " + result.error);
      }

    } catch (err) {
      console.error("Error submitting to serverless function:", err);
      alert("Error submitting data. Check console.");
    }
  });
}
