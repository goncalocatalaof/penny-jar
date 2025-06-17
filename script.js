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

/* Value with 2 decimals
document.querySelectorAll('input[type="text"]').forEach(input => {
  input.addEventListener('blur', () => {
    let value = parseFloat(input.value);
    if (!isNaN(value)) {
      input.value = value.toFixed(2);
    }
  });
});*/

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
