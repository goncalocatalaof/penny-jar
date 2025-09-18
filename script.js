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
    if (dateInput) dateInput.value = today;

    // Category selection (for Personal/Family text categories)
    const categories = form.querySelectorAll(".category");
    categories.forEach(category => {
      category.addEventListener("click", () => {
        categories.forEach(cat => cat.classList.remove("selected"));
        category.classList.add("selected");
      });
    });

    // Utilities icons behavior (store category via data-value)
    if (formId === "form-utilities") {
      const utilityIcons = form.querySelectorAll(".category");
      utilityIcons.forEach(icon => {
        icon.addEventListener("click", () => {
          // Remove highlight
          utilityIcons.forEach(ic => ic.classList.remove("selected"));
          icon.classList.add("selected");

          // Save chosen value into hidden input
          let hiddenInput = form.querySelector("input[name='category']");
          if (!hiddenInput) {
            hiddenInput = document.createElement("input");
            hiddenInput.type = "hidden";
            hiddenInput.name = "category";
            form.appendChild(hiddenInput);
          }
          hiddenInput.value = icon.dataset.value; // e.g., "gas", "water", "electricity"
        });
      });
    }

    // Amount formatting (commas instead of dots)
    const amountInput = form.querySelector(".amount");
    if (amountInput) {
      amountInput.addEventListener("input", () => {
        let value = amountInput.value;
        value = value.replace('.', ',').replace(/[^0-9,]/g, '').replace(/,+/g, ',');
        if (value.includes(',')) {
          const [intPart, decPart] = value.split(',');
          value = intPart + ',' + decPart.slice(0, 2);
        }
        amountInput.value = value;
      });
    }

    // Form submit
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const date = form.querySelector('input[type="date"]').value;
      const amount = form.querySelector(".amount")?.value.trim().replace(',', '.') || "";
      const comment = form.querySelector("input[name='comment']")?.value || "";

      let category = "";
      let consumption = "";

      if (formId === "form-utilities") {
        // Category comes from hidden input
        category = form.querySelector("input[name='category']")?.value || "";
        consumption = form.querySelector("input[name='consumption']")?.value || "";
      } else {
        // Category is text input or selected item
        category = form.querySelector(".category.selected")?.textContent
          || form.querySelector("input[name='category']")?.value
          || "";
      }

      // Build payload dynamically (no null columns)
      const values = [date, category, amount];
      if (formId === "form-utilities") values.push(consumption);
      values.push(comment);

      const payload = {
        sheetName,
        values
      };

      try {
        const response = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
          alert("Data submitted!");
          form.reset();

          // Reset date to today
          if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
          }
        } else {
          console.error(result);
          alert("Failed to submit data. Check console.");
        }

      } catch (err) {
        console.error("Error submitting to serverless function:", err);
        alert("Failed to submit data. Check console.");
      }

    });

  });

});
