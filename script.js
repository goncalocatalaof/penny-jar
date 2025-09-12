// ============================
// NAVIGATION LOGIC
// ============================
function navigate(viewId) {
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
}

// ============================
// 1. DOM Ready
// ============================
document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById("form-personal");

  // Default date to today
  const today = new Date().toISOString().split('T')[0];
  const dateInput = form.querySelector('input[type="date"]');
  if(dateInput) dateInput.value = today;

  // Category selection
  const categories = form.querySelectorAll(".category");
  categories.forEach(category => {
    category.addEventListener("click", () => {
      categories.forEach(cat => cat.classList.remove("selected"));
      category.classList.add("selected");
    });
  });

  // Amount formatting
  const amountInput = form.querySelector(".amount");
  if(amountInput){
    amountInput.addEventListener("input", () => {
      let value = amountInput.value;
      value = value.replace('.', ',').replace(/[^0-9,]/g,'').replace(/,+/g, ',');
      if(value.includes(',')){
        const [intPart, decPart] = value.split(',');
        value = intPart + ',' + decPart.slice(0,2);
      }
      amountInput.value = value;
    });
  }

  // Form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const date = form.querySelector('input[type="date"]').value;
    const amount = form.querySelector(".amount").value.trim().replace(',', '.');
    const category = form.querySelector(".category.selected")?.textContent || "";
    const comment = form.querySelector('input[type="text"]#personal-comment').value;

    const payload = { values: [date, amount, category, comment] };

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if(response.ok){
        alert("Data submitted!");
        form.reset();
      } else {
        console.error(result);
        alert("Failed to submit data. Check console.");
      }

    } catch(err){
      console.error("Error submitting to serverless function:", err);
      alert("Failed to submit data. Check console.");
    }

  });
});
