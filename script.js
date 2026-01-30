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
// No negatives, no thousand separators. Empty string is allowed (treated as 0 when summing).
function isValidMoneyInput(raw) {
  const s = (raw ?? "").toString().trim();
  if (!s) return true; // allow empty
  // Disallow negatives
  if (s.startsWith("-")) return false;

  // Only digits, comma, dot
  if (!/^[0-9.,]+$/.test(s)) return false;

  // Only one separator (either comma or dot) total, and not both.
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) return false;

  const sep = hasComma ? "," : hasDot ? "." : null;
  if (!sep) return true;

  // Must have at most one separator occurrence
  if (s.split(sep).length - 1 > 1) return false;

  // Separator cannot be first or last (optional rule, matches "Amount" behavior)
  if (s.startsWith(sep) || s.endsWith(sep)) return false;

  return true;
}

function normalizeMoneyInput(raw) {
  const s = (raw ?? "").toString().trim();
  if (!s) return ""; // keep empty as empty cell
  return s.replace(",", ".");
}

function moneyToNumber(raw) {
  const s = (raw ?? "").toString().trim();
  if (!s) return 0;
  const n = Number(normalizeMoneyInput(s));
  return Number.isFinite(n) ? n : NaN;
}

// Inline error helpers
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

// Submit to Google Sheets via API
async function submitToSheet(values, sheetName) {
  const res = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sheetName, values }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API error: ${res.status} ${txt}`);
  }

  return res.json().catch(() => ({}));
}

// Family Type rules
const FAMILY_FORCE_CHILD = new Set(["Education", "Gear", "Play", "Clothing"]);

function setFamilyTypeUI(value) {
  const typeWrap = document.getElementById("family-type-wrap");
  const typeSelect = document.getElementById("family-type");
  if (!typeWrap || !typeSelect) return;

  if (value === "__HIDE__") {
    typeWrap.style.display = "none";
    typeSelect.value = "";
    return;
  }

  typeWrap.style.display = "block";
  typeSelect.value = value || "";
}

function updateFamilyTypeOptionsForCategory(category) {
  const typeSelect = document.getElementById("family-type");
  if (!typeSelect) return;

  // Reset options
  typeSelect.innerHTML = "";
  const optEmpty = document.createElement("option");
  optEmpty.value = "";
  optEmpty.textContent = "";
  typeSelect.appendChild(optEmpty);

  // Health -> child/null
  if (category === "Health") {
    const optChild = document.createElement("option");
    optChild.value = "child";
    optChild.textContent = "child";
    typeSelect.appendChild(optChild);
    setFamilyTypeUI("");
    return;
  }

  // Vehicle -> tax/maintenence/insurance/repair/null
  if (category === "Vehicle") {
    ["tax", "maintenence", "insurance", "repair"].forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      typeSelect.appendChild(opt);
    });
    setFamilyTypeUI("");
    return;
  }

  // Forced child categories: Education, Gear, Play, Clothing
  if (FAMILY_FORCE_CHILD.has(category)) {
    // Hide UI; fill value silently
    setFamilyTypeUI("__HIDE__");
    return;
  }

  // Default: show empty only
  setFamilyTypeUI("");
}

document.addEventListener("DOMContentLoaded", () => {
  // Set today's date on all date inputs
  document.querySelectorAll("input[type='date']").forEach(setTodayOnInput);

  // Category selection (shared)
  document.querySelectorAll(".categories").forEach((container) => {
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".category");
      if (!btn) return;

      container.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));
      btn.classList.add("selected");

      // Family type logic only within Family view
      const familyView = btn.closest("#family");
      if (familyView) {
        const cat = btn.textContent.trim();
        updateFamilyTypeOptionsForCategory(cat);
      }

      // Grocery icons toggle (example existing behavior)
      const groceryIconsEl = document.getElementById("grocery-icons");
      if (groceryIconsEl) {
        const cat = btn.textContent.trim();
        groceryIconsEl.style.display = cat === "Grocery" ? "flex" : "none";
      }
    });
  });

  // PERSONAL
  const personalForm = document.getElementById("form-personal");
  if (personalForm) {
    personalForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      clearInlineErrors(e.target);

      const date = personalForm.querySelector("input[name='date']").value || "";
      const category =
        personalForm.querySelector(".category.selected")?.textContent?.trim() || "";
      const amountRaw =
        personalForm.querySelector("input[name='amount']")?.value?.trim() || "";

      if (!isValidMoneyInput(amountRaw)) {
        showFieldError(
          personalForm.querySelector("input[name='amount']"),
          "Valor inválido. Usa apenas números e um separador decimal (vírgula OU ponto)."
        );
        return;
      }

      const amount = normalizeMoneyInput(amountRaw);
      const comment = personalForm.querySelector("input[name='comment']").value || "";

      if (!category) {
        showFieldError(personalForm.querySelector(".categories"), "Seleciona uma categoria.");
        return;
      }

      // Personal sheet expects: Date, Category, Amount, Comments
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
        familyForm.querySelector(".category.selected")?.textContent?.trim() || "";
      const amountRaw =
        familyForm.querySelector("input[name='amount']")?.value?.trim() || "";

      // ✅ FIX: errors now show on FAMILY, not PERSONAL
      if (!isValidMoneyInput(amountRaw)) {
        showFieldError(
          familyForm.querySelector("input[name='amount']"),
          "Valor inválido. Usa apenas números e um separador decimal (vírgula OU ponto)."
        );
        return;
      }

      const amount = normalizeMoneyInput(amountRaw);
      const comment = familyForm.querySelector("input[name='comment']").value || "";

      if (!category) {
        showFieldError(familyForm.querySelector(".categories"), "Seleciona uma categoria.");
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
      const category =
        utilitiesForm.querySelector(".category.selected")?.textContent?.trim() || "";
      const valueRaw =
        utilitiesForm.querySelector("input[name='value']")?.value?.trim() || "";
      const comment = utilitiesForm.querySelector("input[name='comment']").value || "";

      // Utilities might have different rules; keep simple, allow empty or valid money
      if (!isValidMoneyInput(valueRaw)) {
        showFieldError(
          utilitiesForm.querySelector("input[name='value']"),
          "Valor inválido. Usa apenas números e um separador decimal (vírgula OU ponto)."
        );
        return;
      }

      if (!category) {
        showFieldError(utilitiesForm.querySelector(".categories"), "Seleciona uma categoria.");
        return;
      }

      const value = normalizeMoneyInput(valueRaw);

      // Utilities sheet expects: Date, Category, Value, Comments
      const values = [date, category, value, comment];

      try {
        await submitToSheet(values, "Utilities");
        showFormMessage(utilitiesForm, "Registo guardado.", "success");
        utilitiesForm.reset();
        utilitiesForm
          .querySelectorAll(".category")
          .forEach((c) => c.classList.remove("selected"));
        setTodayOnInput(utilitiesForm.querySelector("input[name='date']"));
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
      const mealRaw =
        incomeForm.querySelector("input[name='mealAllowances']")?.value?.trim() || "";
      const extraRaw = incomeForm.querySelector("input[name='extra']")?.value?.trim() || "";
      const comment = incomeForm.querySelector("input[name='comment']")?.value || "";

      if (![salaryRaw, mealRaw, extraRaw].every(isValidMoneyInput)) {
        showFormMessage(
          incomeForm,
          "Valores inválidos. Usa apenas números e um separador decimal (vírgula OU ponto).",
          "error"
        );
        if (!isValidMoneyInput(salaryRaw))
          showFieldError(incomeForm.querySelector("input[name='salary']"), "Valor inválido.");
        if (!isValidMoneyInput(mealRaw))
          showFieldError(
            incomeForm.querySelector("input[name='mealAllowances']"),
            "Valor inválido."
          );
        if (!isValidMoneyInput(extraRaw))
          showFieldError(incomeForm.querySelector("input[name='extra']"), "Valor inválido.");
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
        showFormMessage(
          incomeForm,
          "A soma de Salary + Meal Allowances + Extra tem de ser maior que 0.",
          "error"
        );
        // highlight fields (no specific message needed on each)
        showFieldError(incomeForm.querySelector("input[name='salary']"), "");
        showFieldError(incomeForm.querySelector("input[name='mealAllowances']"), "");
        showFieldError(incomeForm.querySelector("input[name='extra']"), "");
        return;
      }

      const salary = normalizeMoneyInput(salaryRaw);
      const mealAllowances = normalizeMoneyInput(mealRaw);
      const extra = normalizeMoneyInput(extraRaw);

      // Income sheet expects: Date, Salary, Meal Allowances, Extra, Comments (Timestamp auto)
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
