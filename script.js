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
      });
    });

    // Utilities icons behavior (fill category with specific value)
    if(formId === "form-utilities") {
      const utilityIcons = form.querySelectorAll(".category-icon");
      utilityIcons.forEach(icon => {
        icon.addEventListener("click", () => {
          const value = icon.dataset.value; // e.g., "gas", "water", "electricity"
          // Remove selected class from all
          utilityIcons.forEach(ic => ic.classList.remove("selected"));
          icon.classList.add("selected");

          // Update the hidden category (or text input if you want)
          const categoryInput = form.querySelector(".category.selected");
          categories.forEach(cat => cat.classList.remove("selected"));
          const matchingCat = Array.from(categories).find(cat => cat.textContent.toLowerCase() === value);
          if(matchingCat) matchingCat.classList.add("selected");
        });
      });
    }

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
      const amount = form.querySelector(".amount")?.value.trim().replace(',', '.') || "";
      const category = form.querySelector(".category.selected")?.textContent || "";
      const comment = form.querySelector('input[type="text"]#' + formId.split('-')[1] + '-comment')?.value || "";
      const consumption = form.querySelector('input[type="text"]#' + formId.split('-')[1] + '-consumption')?.value || "";

      const payload = { 
        sheetName,             
        values: [date, category, amount, consumption, comment]  // include consumption here
      };

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
