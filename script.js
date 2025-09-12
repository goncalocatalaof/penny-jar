// ============================
// NAVIGATION LOGIC
// ============================
function navigate(viewId) {
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
}

// ============================
// DOM READY EVENTS
// ============================
document.addEventListener('DOMContentLoaded', () => {

  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(input => input.value = today);

  // Category selection logic
  document.querySelectorAll('.categories').forEach(container => {
    const categories = container.querySelectorAll('.category');
    categories.forEach(category => {
      category.addEventListener('click', () => {
        categories.forEach(cat => cat.classList.remove('selected'));
        category.classList.add('selected');
      });
    });
  });

  // Amount input formatting
  document.querySelectorAll('.amount').forEach(input => {
    input.addEventListener('input', () => {
      let value = input.value.replace('.', ',');
      value = value.replace(/[^0-9,]/g, '').replace(/,+/g, ',');
      if (value.includes(',')) {
        const [intPart, decimalPart] = value.split(',');
        value = intPart + ',' + decimalPart.slice(0, 2);
      }
      input.value = value;
    });
  });

  // Attach forms
  attachFormHandler('form-personal');
  attachFormHandler('form-family');
  attachFormHandler('form-utilities');

});

// ============================
// FORM SUBMISSION HANDLER
// ============================
function attachFormHandler(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      // Collect form values
      const dateInput = form.querySelector('input[type="date"]')?.value || '';
      const amountInput = form.querySelector('.amount')?.value.trim().replace(',', '.') || '';
      const commentInput = form.querySelector('input[type="text"]#' + formId.split('-')[0] + '-comment')?.value || '';

      // Get selected category
      const category = form.querySelector('.category.selected')?.textContent || '';

      const values = [dateInput, amountInput, category, commentInput, formId];

      console.log(`Submitting values from ${formId}:`, values);

      // POST to serverless function
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Data submitted from ${formId} to penny sheet`);
        form.reset();
        // reset categories
        form.querySelectorAll('.category.selected').forEach(cat => cat.classList.remove('selected'));
        // reset date
        form.querySelector('input[type="date"]').value = new Date().toISOString().split('T')[0];
      } else {
        alert('Failed to submit: ' + result.error);
      }

    } catch (err) {
      console.error('Error submitting to serverless function:', err);
      alert('Error submitting data. Check console.');
    }
  });
}
