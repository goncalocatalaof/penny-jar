// Navigation
function navigate(viewId) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(viewId).classList.add("active");
}

// Set today’s date
function setTodayOnInput(inputEl) {
  if (!inputEl) return;
  inputEl.value = new Date().toISOString().split("T")[0];
}

// Submit to Google Sheets
async function submitToSheet(values, sheetName) {
  const res = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values, sheetName }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || "Save failed");
  }
  return res.json();
}

// DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  // Set default date for all date inputs
  document.querySelectorAll('input[type="date"]').forEach(setTodayOnInput);

  // CATEGORY SELECTION
  document.querySelectorAll(".categories").forEach((container) => {
    container.addEventListener("click", (ev) => {
      const categoryDiv = ev.target.closest(".category");
      if (!categoryDiv) return;

      // Clear previous selection
      container.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));
      categoryDiv.classList.add("selected");

      const form = container.closest("form");
      if (!form) return;

      // FAMILY form: show grocery icons if Grocery selected
      if (form.id === "form-family") {
        const groceryIcons = document.getElementById("grocery-icons");
        const text = (categoryDiv.textContent || "").trim().toLowerCase();
        if (text === "grocery") {
          groceryIcons.style.display = "flex";
        } else {
          groceryIcons.style.display = "none";
        }
      }

      // UTILITIES: store hidden input value
      if (form.id === "form-utilities") {
        const hidden = form.querySelector("input[name='category']");
        const value = categoryDiv.dataset.value || (categoryDiv.textContent || "").trim();
        if (hidden) hidden.value = value;
      }
    });
  });

  // Grocery icons click: fill comment
  document.querySelectorAll("#grocery-icons .grocery-icon").forEach((icon) => {
    icon.addEventListener("click", () => {
      const word = icon.dataset.word || icon.getAttribute("alt") || "";
      const commentInput = document.getElementById("family-comment");
      if (!commentInput) return;
      commentInput.value = word;
    });
  });

  // --- FORM SUBMISSIONS ---

  // PERSONAL
  const personalForm = document.getElementById("form-personal");
  if (personalForm) {
    personalForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const date = personalForm.querySelector("input[name='date']").value || "";
      const category = personalForm.querySelector(".category.selected")?.textContent?.trim() || "";
      const amount = personalForm.querySelector("input[name='amount']").value?.trim().replace(",", ".") || "";
      const comment = personalForm.querySelector("input[name='comment']").value || "";

      if (!category) { alert("Please select a category."); return; }

      const values = [date, category, amount, comment];

      try {
        await submitToSheet(values, "Personal");
        alert("Saved to Personal.");
        personalForm.reset();
        personalForm.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));
        setTodayOnInput(personalForm.querySelector("input[name='date']"));
      } catch (err) {
        console.error(err);
        alert("Failed to save Personal.");
      }
    });
  }

  // FAMILY
  const familyForm = document.getElementById("form-family");
  if (familyForm) {
    familyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const date = familyForm.querySelector("input[name='date']").value || "";
      const category = familyForm.querySelector(".category.selected")?.textContent?.trim() || "";
      const amount = familyForm.querySelector("input[name='amount']").value?.trim().replace(",", ".") || "";
      const comment = familyForm.querySelector("input[name='comment']").value || "";

      if (!category) { alert("Please select a category."); return; }

      const values = [date, category, amount, comment];

      try {
        await submitToSheet(values, "Family");
        alert("Saved to Family.");
        familyForm.reset();
        familyForm.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));
        const groceryIconsEl = document.getElementById("grocery-icons");
        if (groceryIconsEl) groceryIconsEl.style.display = "none";
        setTodayOnInput(familyForm.querySelector("input[name='date']"));
      } catch (err) {
        console.error(err);
        alert("Failed to save Family.");
      }
    });
  }

  // UTILITIES
  const utilitiesForm = document.getElementById("form-utilities");
  if (utilitiesForm) {
    utilitiesForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const date = utilitiesForm.querySelector("input[name='date']").value || "";
      const category = utilitiesForm.querySelector("input[name='category']").value || "";
      const amount = utilitiesForm.querySelector("input[name='amount']").value?.trim().replace(",", ".") || "";
      const consumption = utilitiesForm.querySelector("input[name='consumption']").value || "";
      const comment = utilitiesForm.querySelector("input[name='comment']").value || "";

      if (!category) { alert("Please select a utility category."); return; }

      const values = [date, category, amount, consumption, comment];

      try {
        await submitToSheet(values, "Utilities");
        alert("Saved to Utilities.");
        utilitiesForm.reset();
        utilitiesForm.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));
        setTodayOnInput(utilitiesForm.querySelector("input[name='date']"));
        utilitiesForm.querySelector("input[name='category']").value = "";
      } catch (err) {
        console.error(err);
        alert("Failed to save Utilities.");
      }
    });
  }
});

