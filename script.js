// script.js

// Navigation
function navigate(viewId) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(viewId).classList.add("active");
}

// helpers
function setTodayOnInput(inputEl) {
  if (!inputEl) return;
  inputEl.value = new Date().toISOString().split("T")[0];
}

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

// DOM ready
document.addEventListener("DOMContentLoaded", () => {
  // set default date for every date input
  document.querySelectorAll('input[type="date"]').forEach(setTodayOnInput);

  // CATEGORY CLICKING (delegated per .categories container)
  document.querySelectorAll(".categories").forEach((container) => {
    container.addEventListener("click", (ev) => {
      const categoryDiv = ev.target.closest(".category");
      if (!categoryDiv) return;

      // clear selected in this container and set on clicked
      container.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));
      categoryDiv.classList.add("selected");

      // determine which form this container belongs to
      const form = container.closest("form");
      if (!form) return;

      // FAMILY form: show grocery icons if category is Grocery
      if (form.id === "form-family") {
        const groceryIcons = document.getElementById("grocery-icons");
        const text = (categoryDiv.textContent || "").trim().toLowerCase();
        if (text === "grocery") {
          groceryIcons.style.display = "flex";
        } else {
          groceryIcons.style.display = "none";
        }
      }

      // UTILITIES form: store the chosen category in hidden input
      if (form.id === "form-utilities") {
        const hidden = form.querySelector("input[name='category']"); // exists in HTML
        // prefer data-value (for icon-based categories), otherwise use text
        const value = (categoryDiv.dataset && categoryDiv.dataset.value)
          ? categoryDiv.dataset.value
          : (categoryDiv.textContent || "").trim();
        if (hidden) hidden.value = value;
      }
    });
  });

  // Grocery icons clicking (fill comment)
  const groceryIcons = document.querySelectorAll("#grocery-icons .grocery-icon");
  groceryIcons.forEach((icon) => {
    icon.addEventListener("click", () => {
      const word = icon.dataset.word || icon.getAttribute("alt") || "";
      const commentInput = document.getElementById("family-comment");
      if (!commentInput) return;
      commentInput.value = word;
    });
  });

  // ---- Form handlers ----

  // PERSONAL
  const personalForm = document.getElementById("form-personal");
  if (personalForm) {
    personalForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const date = personalForm.querySelector("input[name='date']").value || "";
      const category = personalForm.querySelector(".category.selected")?.textContent?.trim() || "";
      const amount = personalForm.querySelector("input[name='amount']").value?.trim().replace(",", ".") || "";
      const comment = personalForm.querySelector("input[name='comment']").value || "";

      if (!category) {
        alert("Please select a category for Personal.");
        return;
      }

      const values = [date, category, amount, comment];

      try {
        await submitToSheet(values, "Personal1"); // keep your actual sheet tab name here
        alert("Saved to Personal.");
        personalForm.reset();
        // clear categories selection
        personalForm.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));
        // reset date
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

      if (!category) {
        alert("Please select a category for Family.");
        return;
      }

      const values = [date, category, amount, comment];

      try {
        await submitToSheet(values, "Family");
        alert("Saved to Family.");
        familyForm.reset();
        familyForm.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));
        // hide grocery icons and reset date
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
    // ensure clicking a utility category also sets the hidden input (in case user clicks the img directly)
    utilitiesForm.querySelectorAll(".category").forEach((cat) => {
      cat.addEventListener("click", () => {
        const hidden = utilitiesForm.querySelector("input[name='category']");
        const value = cat.dataset.value || (cat.textContent || "").trim();
        if (hidden) hidden.value = value;
      });
