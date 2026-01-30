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


// Money input validation: only digits plus optional ONE decimal separator (comma OR dot).
// No negatives, no thousand separators. Empty string is allowed (treated as 0 when summed).
function isValidMoneyInput(raw) {
  const s = (raw ?? "").toString().trim();
  if (!s) return true;
  return /^\d+(?:[\.,]\d+)?$/.test(s);
}

function normalizeMoneyInput(raw) {
  const s = (raw ?? "").toString().trim();
  if (!s) return "";
  return s.replace(",", ".");
}

function moneyToNumber(raw) {
  const normalized = normalizeMoneyInput(raw);
  if (!normalized) return 0;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}



// --- Inline form validation helpers ---
function clearInlineErrors(form) {
  if (!form) return;
  form.querySelectorAll(".field-error").forEach((el) => el.remove());
  form.querySelectorAll(".input-error").forEach((el) => el.classList.remove("input-error"));
  const msg = form.querySelector(".form-message");
  if (msg) msg.remove();
}

function showFormMessage(form, message, kind = "error") {
  if (!form) return;
  // Remove previous message
  const existing = form.querySelector(".form-message");
  if (existing) existing.remove();

  const div = document.createElement("div");
  div.className = `form-message ${kind}`;
  div.textContent = message;

  // Put message right under the <h2> visually (top of form)
  form.insertBefore(div, form.firstChild);
}

function showFieldError(anchorEl, message) {
  if (!anchorEl) return;
  // Remove existing error right after this field/group if present
  const next = anchorEl.nextElementSibling;
  if (next && next.classList.contains("field-error")) next.remove();

  if (message) {
    const err = document.createElement("div");
    err.className = "field-error";
    err.textContent = message;
    anchorEl.insertAdjacentElement("afterend", err);
  }

  // Highlight only inputs/textareas/selects; for groups (like .categories) just show message
  if (anchorEl.matches && anchorEl.matches("input, textarea, select")) {
    anchorEl.classList.add("input-error");
    anchorEl.addEventListener(
      "input",
      () => {
        anchorEl.classList.remove("input-error");
        const n = anchorEl.nextElementSibling;
        if (n && n.classList.contains("field-error")) n.remove();
      },
      { once: true }
    );
  }
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

  // --- FAMILY: Type rules ---
  // These categories always send type="Child" and do NOT show the Type UI
  const FAMILY_FORCE_CHILD = new Set(["Education", "Gear", "Play", "Clothing"]);

  // Categories that show a Type selector and their allowed values
  // "" means (none) / null
  const FAMILY_TYPE_OPTIONS = {
    Health: ["Child"],
    Vehicle: ["Tax", "Maintenance", "Insurance", "Repair"],
  };

  // Renders clickable "type" boxes in the same style as categories (reusing .categories/.category CSS)
  // Requires HTML in Family form:
  // - <div id="family-type-group" style="display:none;">
  //     <div class="categories" id="family-type-options"></div>
  //     <input type="hidden" id="family-type" name="type" />
  //   </div>
  function setFamilyTypeUI(category) {
    const group = document.getElementById("family-type-group");
    const optionsWrap = document.getElementById("family-type-options");
    const hidden = document.getElementById("family-type");
    if (!group || !optionsWrap || !hidden) return;

    const hideAndClear = () => {
      group.style.display = "none";
      optionsWrap.innerHTML = "";
      hidden.value = "";
    };

    if (!category) return hideAndClear();

    // Force child without showing UI
    if (FAMILY_FORCE_CHILD.has(category)) {
      hideAndClear();
      hidden.value = "child";
      return;
    }

    const options = FAMILY_TYPE_OPTIONS[category];
    if (!options) return hideAndClear();

    group.style.display = "block";
    hidden.value = ""; // default none

    optionsWrap.innerHTML = options
      .map((v) => {
        const label = v === "" ? "None" : v;
        const value = v; // "" stays ""
        return `<div class="category" data-type="${value}">${label}</div>`;
      })
      .join("");

    // Click handler for type boxes (scoped to this render)
    optionsWrap.querySelectorAll(".category").forEach((el) => {
      el.addEventListener("click", () => {
        optionsWrap
          .querySelectorAll(".category")
          .forEach((c) => c.classList.remove("selected"));
        el.classList.add("selected");
        hidden.value = el.dataset.type ?? "";
      });
    });
  }

  // CATEGORY SELECTION
  document.querySelectorAll(".categories").forEach((container) => {
    container.addEventListener("click", (ev) => {
      const categoryDiv = ev.target.closest(".category");
      if (!categoryDiv) return;

      // Ignore clicks on the "Type" boxes here (they have their own handler)
      if (container.id === "family-type-options") return;

      // Clear previous selection (only inside this container)
      container
        .querySelectorAll(".category")
        .forEach((c) => c.classList.remove("selected"));
      categoryDiv.classList.add("selected");

      const form = container.closest("form");
      if (!form) return;

      // FAMILY form: show grocery icons if Grocery selected + manage Type
      if (form.id === "form-family") {
        const groceryIcons = document.getElementById("grocery-icons");
        const categoryText = (categoryDiv.textContent || "").trim();

        // Grocery icons
        if (categoryText.toLowerCase() === "grocery") {
          groceryIcons.style.display = "flex";
        } else {
          groceryIcons.style.display = "none";
        }

        // Type UI + forced values
        setFamilyTypeUI(categoryText);
      }

      // UTILITIES: store hidden input value
      if (form.id === "form-utilities") {
        const hidden = form.querySelector("input[name='category']");
        const value =
          categoryDiv.dataset.value || (categoryDiv.textContent || "").trim();
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

      clearInlineErrors(e.target);
      const date = personalForm.querySelector("input[name='date']").value || "";
      const category =
        personalForm.querySelector(".category.selected")?.textContent?.trim() ||
        "";
      const amountRaw =
        personalForm.querySelector("input[name='amount']")?.value?.trim() || "";

      if (!isValidMoneyInput(amountRaw)) {
        showFieldError(personalForm.querySelector("input[name='amount']"), "Valor inválido. Usa apenas números e um separador decimal (vírgula OU ponto).");
        return;
      }

      const amount = normalizeMoneyInput(amountRaw);
      const comment = personalForm.querySelector("input[name='comment']").value || "";

      if (!category) {
        showFieldError(personalForm.querySelector(".categories"), "Seleciona uma categoria.");
        return;
      }

      const values = [date, category, amount, comment];

      try {
        await submitToSheet(values, "Personal");
        showFormMessage(personalForm, "Registo guardado.", "success");
        personalForm.reset();
        personalForm
          .querySelectorAll(".category")
          .forEach((c) => c.classList.remove("selected"));
        setTodayOnInput(personalForm.querySelector("input[name='date']"));
      } catch (err) {
        console.error(err);
        showFormMessage(personalForm, "Erro ao guardar. Tenta novamente.", "error");
      }
    });
  }

  // FAMILY
  const familyForm = document.getElementById("form-family");
  if (familyForm) {
    familyForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      clearInlineErrors(e.target);
      const date = familyForm.querySelector("input[name='date']").value || "";
      const category =
        familyForm.querySelector(".category.selected")?.textContent?.trim() ||
        "";
      const amountRaw =
        familyForm.querySelector("input[name='amount']")?.value?.trim() || "";

      if (!isValidMoneyInput(amountRaw)) {
        showFieldError(personalForm.querySelector("input[name='amount']"), "Valor inválido. Usa apenas números e um separador decimal (vírgula OU ponto).");
        return;
      }

      const amount = normalizeMoneyInput(amountRaw);
      const comment = familyForm.querySelector("input[name='comment']").value || "";

      if (!category) {
        showFieldError(personalForm.querySelector(".categories"), "Seleciona uma categoria.");
        return;
      }

      // Type logic (Family)
      let type = "";
      if (FAMILY_FORCE_CHILD.has(category)) {
        type = "child";
      } else {
        type = (document.getElementById("family-type")?.value || "").trim(); // "" => empty cell
      }

      // Family sheet expects: Date, Category, Amount, Comments, Type
      const values = [date, category, amount, comment, type];

      try {
        await submitToSheet(values, "Family");
        showFormMessage(familyForm, "Registo guardado.", "success");
        familyForm.reset();

        familyForm
          .querySelectorAll(".category")
          .forEach((c) => c.classList.remove("selected"));

        const groceryIconsEl = document.getElementById("grocery-icons");
        if (groceryIconsEl) groceryIconsEl.style.display = "none";

        // Reset Type UI + hidden value
        setFamilyTypeUI("");

        setTodayOnInput(familyForm.querySelector("input[name='date']"));
      } catch (err) {
        console.error(err);
        showFormMessage(familyForm, "Erro ao guardar. Tenta novamente.", "error");
      }
    });
  }

  // UTILITIES
  const utilitiesForm = document.getElementById("form-utilities");
  if (utilitiesForm) {
    utilitiesForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      clearInlineErrors(e.target);
      const date = utilitiesForm.querySelector("input[name='date']").value || "";
      const category = utilitiesForm.querySelector("input[name='category']").value || "";
      const amount =
        utilitiesForm
          .querySelector("input[name='amount']")
          .value?.trim()
          .replace(",", ".") || "";
      const consumption = utilitiesForm.querySelector("input[name='consumption']").value || "";
      const comment = utilitiesForm.querySelector("input[name='comment']").value || "";

      if (!category) {
        showFieldError(utilitiesForm.querySelector(".categories"), "Seleciona uma categoria.");
        return;
      }

      const values = [date, category, amount, consumption, comment];

      try {
        await submitToSheet(values, "Utilities");
        showFormMessage(utilitiesForm, "Registo guardado.", "success");
        utilitiesForm.reset();
        utilitiesForm
          .querySelectorAll(".category")
          .forEach((c) => c.classList.remove("selected"));
        setTodayOnInput(utilitiesForm.querySelector("input[name='date']"));
        utilitiesForm.querySelector("input[name='category']").value = "";
      } catch (err) {
        console.error(err);
        showFormMessage(utilitiesForm, "Erro ao guardar. Tenta novamente.", "error");
      }
    });
  }

  // INCOME
  const incomeForm = document.getElementById("form-income");
  if (incomeForm) {
    incomeForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      clearInlineErrors(e.target);

      const dateInput = incomeForm.querySelector("input[name='date']");
      const date = (dateInput?.value || "").trim() || new Date().toISOString().split("T")[0];

      const salaryRaw = incomeForm.querySelector("input[name='salary']")?.value?.trim() || "";
      const mealRaw = incomeForm.querySelector("input[name='mealAllowances']")?.value?.trim() || "";
      const extraRaw = incomeForm.querySelector("input[name='extra']")?.value?.trim() || "";
      const comment = incomeForm.querySelector("input[name='comment']")?.value || "";

      if (![salaryRaw, mealRaw, extraRaw].every(isValidMoneyInput)) {
        showFormMessage(incomeForm, "Valores inválidos. Usa apenas números e um separador decimal (vírgula OU ponto).", "error");
        if (!isValidMoneyInput(salaryRaw)) showFieldError(incomeForm.querySelector("input[name='salary']"), "Valor inválido.");
        if (!isValidMoneyInput(mealRaw)) showFieldError(incomeForm.querySelector("input[name='mealAllowances']"), "Valor inválido.");
        if (!isValidMoneyInput(extraRaw)) showFieldError(incomeForm.querySelector("input[name='extra']"), "Valor inválido.");
        return;
      }

      const salaryNum = moneyToNumber(salaryRaw);
      const mealNum = moneyToNumber(mealRaw);
      const extraNum = moneyToNumber(extraRaw);

      if ([salaryNum, mealNum, extraNum].some((n) => Number.isNaN(n))) {
        showFormMessage(incomeForm, "Valores inválidos.", "error");
        return;
      }

      const total = salaryNum + mealNum + extraNum;
      if (!(total > 0)) {
        showFormMessage(incomeForm, "A soma de Salary + Meal Allowances + Extra tem de ser maior que 0.", "error");
        showFieldError(incomeForm.querySelector("input[name='salary']"), "");
        showFieldError(incomeForm.querySelector("input[name='mealAllowances']"), "");
        showFieldError(incomeForm.querySelector("input[name='extra']"), "");
        return;
      }

      const salary = normalizeMoneyInput(salaryRaw);
      const mealAllowances = normalizeMoneyInput(mealRaw);
      const extra = normalizeMoneyInput(extraRaw);

      const values = [date, salary, mealAllowances, extra, comment];

      try {
        await submitToSheet(values, "Income");
        showFormMessage(incomeForm, "Registo guardado.", "success");
        incomeForm.reset();
        setTodayOnInput(dateInput);
      } catch (err) {
        console.error(err);
        showFormMessage(incomeForm, "Erro ao guardar. Tenta novamente.", "error");
      }
    });
  }


});
