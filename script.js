// Set today's date by default when the page loads
window.addEventListener('DOMContentLoaded', () => {
  const dateField = document.getElementById('date');
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateField.value = `${yyyy}-${mm}-${dd}`;
});

document.getElementById('expense-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const data = {
    date: document.getElementById('date').value,
    value: document.getElementById('value').value,
    cost: document.getElementById('cost').value,
    comments: document.getElementById('comments').value,
  };

  try {
    const response = await fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec', {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    document.getElementById('mensagem').textContent = 'Expense successfully submitted!';
    document.getElementById('expense-form').reset();

    // Reset date to today after form reset
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('date').value = `${yyyy}-${mm}-${dd}`;
  } catch (error) {
    console.error('Submission error:', error);
    document.getElementById('mensagem').textContent = 'An error occurred. Please try again.';
  }
});