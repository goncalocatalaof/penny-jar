// ==============================
// Navigation
// ==============================
function navigate(viewId) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(viewId).classList.add("active");
}

// ==============================
// Date helpers
// ==============================
function setTodayOnInput(inputEl) {
  if (!inputEl) return;
  inputEl.value = new Date().toISOString().split("T")[0];
}

// ==============================
// Strict money validation
// Rules:
// - allow empty
// - only digits + optional ONE separator (comma OR dot)
// - no negatives
// - no thousand separators
// - no both comma and dot
// - separator not first/last
// ==============================
function isValidMoneyInput(raw) {
  const s = (raw ?? "").toString().trim();
  if (!s) return true;

  if (s.startsWith("-")) return false;
  if (!/^[0-9.,]+$/.test(s)) return false;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) return false;

  const sep = hasComma ? "," : hasDot ? "." : null;
  if (!sep) return true;

  if ((s.split(sep).length - 1) > 1) return false;
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

// ==============================
// Inline error helpers (scoped to the form)
// ==============================
function clearInlineErrors(formEl) {
  if (!formEl) return;
  formEl.querySelectorAll(".field-error").forEach((el) => el.remove());
  formEl.querySelectorAll(".input-error").forEach((el) => el.classList.remove("input-error"));
  const msg = formEl.querySelector(".form-message");
  if (msg) msg.remove();
}

function showFormMessage(formEl, message, kind = "error") {
  if (!formEl) return;

  const existing = formEl.querySelector(".form-message");
  if (existing) existing.remove();

  const div = document.createElement("div");
  div.className = `form-message ${kind}`;
  div.textContent = message;

  formEl.insertBefore(div, formEl.firstChild);
}

function showFieldError(anchorEl, message) {
  if (!anchorEl) return;

  // remove existing inline error directly after this anchor
  const next = anchorEl.nextElementSibling;
  if (next && next.classList.contains("field-error")) next.remove();

  if (message) {
    const err = document.createElement("div");
    err.className = "field-error";
    err.textContent = message;
    anchorEl.insertAdjacentElement("afterend", err);
  }

  // highlight only form controls
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

// ==============================
// API submit
// ==============================
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

// ==============================
// FAMILY: Type rules + UI (clickable boxes like categories)
// Requires in Family form HTML:
// <div id="family-type-group" style="display:none;">
//   <label>Type</label>
//   <div class="categories" id="family-type-options"></div>
//   <input type="hidden" id="family-type" name="type" />
// </div>
// ==============================
const FAMILY_FORCE_CHILD = new Set(["Education", "Gear", "Play", "Clothing"]);

const FAMILY_TYPE_OPTIONS = {
  Health: ["Child"],
  Vehicle: ["Tax", "Maintenence", "Insurance", "Repair"],
};

function clearFamilyTypeUI() {
  const group = document.getElementById("family-type-group");
  const optionsWrap = document.getElementById("family-type-options");
  const hidden = document.getElementById("family-type");

  if (group) group.style.display = "none";
  if (optionsWrap) optionsWrap.innerHTML = "";
  if (hidden) hidden.value = "";
}

function setFamilyTypeUIForCategory(category) {
  const group = document.getElementById("family-type-group");
  const optionsWrap = document.getElementById("family-type-options");
  const hidden = document.getElementById("family-type");

  // If the Family type area isn't in the HTML, do nothing (keeps app functional)
  if (!group || !optionsWrap || !hidden) return;

  const hideAndClear = () => {
    group.style.display = "none";
    optionsWrap.innerHTML = "";
    hidden.value = "";
  };

  if (!category) return hideAndClear();

  // Forced categories -> type=child silently, no UI
  if (FAMILY_FORCE_CHILD.has(category)) {
    hideAndClear();
    hidden.value = "Child";
    return;
  }

  const options = FAMILY_TYPE_OPTIONS[category];
  if (!options) return hideAndClear();

  group.style.display = "block";
  hidden.value = ""; // default empty (=null in sheet)

  optionsWrap.innerHTML = options
    .map((v) => {
      // show label nicer; stored value is lowercase
      const label = v.charAt(0).toUpperCase() + v.slice(1);
      return `<div class="category" data-type="${v}">${label}</div>`;
    })
    .join("");

  optionsWrap.querySelectorAll(".category").forEach((el) => {
    el.addEventListener("click", () => {
      optionsWrap.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));
      el.classList.add("selected");
      hidden.value = el.dataset.type ?? "";
    });
  });
}

// ==============================
// DOM Ready
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  // Default date on all date inputs
  document.querySelectorAll("input[type='date']").forEach(setTodayOnInput);

  // CATEGORY selection (Personal / Family / Utilities)
  document.querySelectorAll(".categories").forEach((container) => {
    container.addEventListener("click", (e) => {
      // Ignore clicks in Family Type options container (handled by its own listeners)
      if (container.id === "family-type-options") return;

      const btn = e.target.closest(".category");
      if (!btn) return;

      container.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));
      btn.classList.add("selected");

      const cat = btn.textContent.trim();

      // Family: update type UI based on selected category
      if (btn.closest("#family")) {
        setFamilyTypeUIForCategory(cat);
      }

      // Optional: Grocery icons toggle (if element exists)
      const groceryIconsEl = document.getElementById("grocery-icons");
      if (groceryIconsEl) {
        groceryIconsEl.style.display = cat === "Grocery" ? "flex" : "none";
      }
    });
  });

  // ==========================
  // PERSONAL
  // ==========================
  const personalForm = document.getElementById("form-personal");
  if (personalForm) {
    personalForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearInlineErrors(personalForm);

      const date = personalForm.querySelector("input[name='date']")?.value || "";
      const category =
        personalForm.querySelector(".category.selected")?.textContent?.trim() || "";
      const amountEl = personalForm.querySelector("input[name='amount']");
      const amountRaw = amountEl?.value?.trim() || "";
      const comment = personalForm.querySelector("input[name='comment']")?.value || "";

      if (!category) {
        showFieldError(personalForm.querySelector(".categories"), "Select one category.");
        return;
      }

      if (!isValidMoneyInput(amountRaw)) {
        showFieldError(
          amountEl,
          "Invalid value. Use only numbers with a comma or dot."
        );
        return;
      }

      const amount = normalizeMoneyInput(amountRaw);

      // Sheet Personal: Date; Category; Amount; Comments  (Timestamp is auto on backend if present)
      const values = [date, category, amount, comment];

      try {
        await submitToSheet(values, "Personal");
        showFormMessage(personalForm, "Saved successfully.", "success");
        personalForm.reset();
        personalForm.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));
        setTodayOnInput(personalForm.querySelector("input[name='date']"));
      } catch (err) {
        console.error(err);
        showFormMessage(personalForm, "Save failed. Please try again.", "error");
      }
    });
  }

  // ==========================
  // FAMILY
  // ==========================
  const familyForm = document.getElementById("form-family");
  if (familyForm) {
    familyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearInlineErrors(familyForm);

      const date = familyForm.querySelector("input[name='date']")?.value || "";
      const category =
        familyForm.querySelector(".category.selected")?.textContent?.trim() || "";
      const amountEl = familyForm.querySelector("input[name='amount']");
      const amountRaw = amountEl?.value?.trim() || "";
      const comment = familyForm.querySelector("input[name='comment']")?.value || "";

      if (!category) {
        showFieldError(familyForm.querySelector(".categories"), "Select one category.");
        return;
      }

      if (!isValidMoneyInput(amountRaw)) {
        // IMPORTANT: show error on FAMILY (scoped)
        showFieldError(
          amountEl,
          "Invalid value. Use only numbers with a comma or dot."
        );
        return;
      }

      const amount = normalizeMoneyInput(amountRaw);

      // Family type comes from hidden input (set by type UI or forced rules)
      // - If forced child categories were selected, hidden will already be "child"
      // - Otherwise, can be "" (null) or one of the options
      const type = (document.getElementById("family-type")?.value || "").trim();

      // Sheet Family expected order (as per your app): Date; Category; Amount; Comments; Type
      const values = [date, category, amount, comment, type];

      try {
        await submitToSheet(values, "Family");
        showFormMessage(familyForm, "Saved successfully.", "success");

        familyForm.reset();
        familyForm.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));

        const groceryIconsEl = document.getElementById("grocery-icons");
        if (groceryIconsEl) groceryIconsEl.style.display = "none";

        clearFamilyTypeUI();
        setTodayOnInput(familyForm.querySelector("input[name='date']"));
      } catch (err) {
        console.error(err);
        showFormMessage(familyForm, "Save failed. Please try again.", "error");
      }
    });
  }

  // ==========================
  // UTILITIES
  // ==========================
  const utilitiesForm = document.getElementById("form-utilities");
  if (utilitiesForm) {
    utilitiesForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearInlineErrors(utilitiesForm);

      const date = utilitiesForm.querySelector("input[name='date']")?.value || "";
      const category =
        utilitiesForm.querySelector(".category.selected")?.textContent?.trim() || "";
      const valueEl = utilitiesForm.querySelector("input[name='value']");
      const valueRaw = valueEl?.value?.trim() || "";
      const comment = utilitiesForm.querySelector("input[name='comment']")?.value || "";

      if (!category) {
        showFieldError(utilitiesForm.querySelector(".categories"), "Select one category.");
        return;
      }

      if (!isValidMoneyInput(valueRaw)) {
        showFieldError(
          valueEl,
          "Invalid value. Use only numbers with a comma or dot."
        );
        return;
      }

      const value = normalizeMoneyInput(valueRaw);

      // Sheet Utilities: Date; Category; Value; Comments
      const values = [date, category, value, comment];

      try {
        await submitToSheet(values, "Utilities");
        showFormMessage(utilitiesForm, "Saved successfully.", "success");
        utilitiesForm.reset();
        utilitiesForm.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));
        setTodayOnInput(utilitiesForm.querySelector("input[name='date']"));
      } catch (err) {
        console.error(err);
        showFormMessage(utilitiesForm, "Save failed. Please try again.", "error");
      }
    });
  }

  // ==========================
  // INCOME
  // ==========================
  const incomeForm = document.getElementById("form-income");
  if (incomeForm) {
    incomeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearInlineErrors(incomeForm);

      const dateInput = incomeForm.querySelector("input[name='date']");
      const date = (dateInput?.value || "").trim() || new Date().toISOString().split("T")[0];

      const salaryEl = incomeForm.querySelector("input[name='salary']");
      const mealEl = incomeForm.querySelector("input[name='mealAllowances']");
      const extraEl = incomeForm.querySelector("input[name='extra']");

      const salaryRaw = salaryEl?.value?.trim() || "";
      const mealRaw = mealEl?.value?.trim() || "";
      const extraRaw = extraEl?.value?.trim() || "";

      const comment = incomeForm.querySelector("input[name='comment']")?.value || "";

      // Validate format (strict)
      let ok = true;
      if (!isValidMoneyInput(salaryRaw)) {
        showFieldError(
          salaryEl,
          "Invalid value. Use only numbers with a comma or dot."
        );
        ok = false;
      }
      if (!isValidMoneyInput(mealRaw)) {
        showFieldError(
          mealEl,
          "Invalid value. Use only numbers with a comma or dot."
        );
        ok = false;
      }
      if (!isValidMoneyInput(extraRaw)) {
        showFieldError(
          extraEl,
          "Invalid value. Use only numbers with a comma or dot."
        );
        ok = false;
      }
      if (!ok) return;

      // Rule: sum must be > 0
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
          "  Please ensure that at least one income type has value.",
          "error"
        );
        // highlight fields (no extra message needed)
        showFieldError(salaryEl, "");
        showFieldError(mealEl, "");
        showFieldError(extraEl, "");
        return;
      }

      // Store with dot only
      const salary = normalizeMoneyInput(salaryRaw);
      const mealAllowances = normalizeMoneyInput(mealRaw);
      const extra = normalizeMoneyInput(extraRaw);

      // Sheet Income columns: Timestamp(auto); Date; Salary; Meal Allowances; Extra; Comments
      // -> we send: Date; Salary; Meal Allowances; Extra; Comments
      const values = [date, salary, mealAllowances, extra, comment];

      try {
        await submitToSheet(values, "Income");
        showFormMessage(incomeForm, "Saved successfully.", "success");
        incomeForm.reset();
        setTodayOnInput(dateInput);
      } catch (err) {
        console.error(err);
        showFormMessage(incomeForm, "Save failed. Please try again.", "error");
      }
    });
  }
});


