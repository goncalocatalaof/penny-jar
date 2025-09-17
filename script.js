// ============================
// NAVIGATION LOGIC
// ============================
function navigate(viewId) {
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
}

// ============================
// DOM Ready
// ============================
document.addEventListener('DOMContentLoaded', () => {

  const forms = [
    { formId: "form-personal", sheetName: "Personal1" },
    { formId: "form-family", sheetName: "Family" },
    { formId: "form-utilities", sheetName: "Utilities" }
  ];

  forms.forEach(({ formId, sheetName }) => {
    const form = document.getElementById(formId);
    if (!form) return;

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

        // Family form: show grocery icons if category is grocery
        if(sheetName === "Family"){
          const selectedCategory = category.textContent.toLowerCase();
          const groceryIcons = document.getElementById("grocery-icons");
          if(selectedCategory === "grocery"){
            groceryIcons.style.display = "flex";
          } else {
            groceryIcons.style.display = "none";
          }
        }
      });
    });

    // Amount/value formatting
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

    // Grocery icons click (Family form)
    if(sheetName === "Family"){
      const groceryIcons = document.querySelectorAll(".grocery-icon");
      groceryIcons.forEach(icon => {
        icon.addEventListener("click", () => {
          const word = icon.dataset.word;
          const commentInput = form.querySelector('input[type="text"]#family-comment');
          if(commentInput) commentInput.value = word;
        });
      });
    }

    // Form submit
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // ===== Get values per form =====
      let payloadValues = [];
      if(sheetName === "Personal1"){
        const date = form.querySelector('input[type="date"]').value;
        const amount = form.querySelector(".amount").value.trim().replace(',', '.');
        const category = form.querySelector(".category.selected")?.textContent || "";
        const comment = form.querySelector('input[type="text"]#personal-comment')?.value || "";
        payloadValues = [date, amount, category, comment];

      } else if(sheetName === "Family"){
        const date = form.querySelector('input[type="date"]').value;
        const category = form.querySelector(".category.selected")?.textContent || "";
        const amount = form.querySelector(".amount")?.value.trim().replace(',', '.') || "";
        const comment = form.querySelector('input[type="text"]#family-comment')?.value || "";
        payloadValues = [date, category, amount, comment]; // adjust columns in Google Sheet if needed

      } else if(sheetName === "Utilities"){
        const date = form.querySelector('input[type="date"]').value;
        const category = form.querySelector(".category.selected")?.textContent || "";
        const value = form.querySelector(".amount").value.trim().replace(',', '.') || "";
        const consumption = form.querySelector('input[name="consumption"]')?.value || "";
        const comment = form.querySelector('input[type="text"]#utilities-comment')?.value || "";
        payloadValues = [date, category, value, consumption, comment];
      }

      const payload = { sheetName, values: payloadValues };

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

          // Reset date to today
          const dateInput = form.querySelector('input[type="date"]');
          if(dateInput){
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
          }

          // Hide grocery icons after submit
          if(sheetName === "Family"){
            const groceryIcons = document.getElementById("grocery-icons");
            if(groceryIcons) groceryIcons.style.display = "none";
          }

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

});
