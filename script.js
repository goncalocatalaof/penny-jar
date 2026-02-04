/* ==============================
   1) Navigation
   ============================== */

function navigate(viewId) {
  // Desativa todas as views e ativa só a pedida
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));

  const el = document.getElementById(viewId);
  if (!el) return;

  el.classList.add("active");
}

/* ==============================
   2) Date helpers
   ============================== */

function setTodayOnInput(inputEl) {
  if (!inputEl) return;
  inputEl.value = new Date().toISOString().split("T")[0];
}

/* ==============================
   3) Money helpers (strict)
   ============================== */

/**
 * Rules:
 * - allow empty
 * - only digits + optional ONE separator (comma OR dot)
 * - no negatives
 * - no thousand separators
 * - no both comma and dot
 * - separator not first/last
 */
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

  if (s.split(sep).length - 1 > 1) return false;
  if (s.startsWith(sep) || s.endsWith(sep)) return false;

  return true;
}

/** Converts comma decimal to dot decimal. Keeps empty as empty. */
function normalizeMoneyInput(raw) {
  const s = (raw ?? "").toString().trim();
  if (!s) return "";
  return s.replace(",", ".");
}

function moneyToNumber(raw) {
  const s = (raw ?? "").toString().trim();
  if (!s) return 0;
  const n = Number(normalizeMoneyInput(s));
  return Number.isFinite(n) ? n : NaN;
}

/* ==============================
   4) Inline error helpers (scoped)
   ============================== */

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

  // Remove existing inline error directly after this anchor
  const next = anchorEl.nextElementSibling;
  if (next && next.classList.contains("field-error")) next.remove();

  if (message) {
    const err = document.createElement("div");
    err.className = "field-error";
    err.textContent = message;
    anchorEl.insertAdjacentElement("afterend", err);
  }

  // Highlight only form controls
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

/* ==============================
   5) API submit
   ============================== */

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

/* ==============================
   6) Family: Type rules + UI
   ============================== */

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

/* ==============================
   7) Shared UI wiring
   ============================== */

/**
 * One handler for clicking category boxes inside each .categories container.
 * - Selects .category
 * - Applies Family Type UI rules
 * - Handles optional grocery icon area
 *
 * NOTE: This uses event delegation, so it works for all forms automatically.
 */
function wireCategorySelection() {
  document.querySelectorAll(".categories").forEach((container) => {
    container.addEventListener("click", (e) => {
      // Ignore clicks in Family Type options container (handled by its own listeners)
      if (container.id === "family-type-options") return;

      const btn = e.target.closest(".category");
      if (!btn) return;

      // Normal selection behavior for this container
      container.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));
      btn.classList.add("selected");

      // Resolve category text:
      // - For utility icons, the text might be empty; keep fallback to data-value if present.
      const cat = (btn.textContent || "").trim() || (btn.dataset.value || "").trim();

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
}

/** Family grocery icon click -> fills the comment field. */
function wireFamilyGroceryIcons() {
  const familyForm = document.getElementById("form-family");
  if (!familyForm) return;

  const groceryIconsEl = document.getElementById("grocery-icons");
  const familyCommentInput =
    document.getElementById("family-comment") || familyForm.querySelector("input[name='comment']");

  if (!groceryIconsEl || !familyCommentInput) return;

  groceryIconsEl.addEventListener("click", (e) => {
    const img = e.target.closest("img.grocery-icon");
    if (!img) return;

    const word = img.dataset.word;
    if (!word) return;

    familyCommentInput.value = word;
    familyCommentInput.focus();
  });
}

/* ==============================
   8) Form handlers
   ============================== */

function wirePersonalForm() {
  const form = document.getElementById("form-personal");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearInlineErrors(form);

    const date = form.querySelector("input[name='date']")?.value || "";
    const category = form.querySelector(".category.selected")?.textContent?.trim() || "";
    const amountEl = form.querySelector("input[name='amount']");
    const amountRaw = amountEl?.value?.trim() || "";
    const comment = form.querySelector("input[name='comment']")?.value || "";

    if (!category) {
      showFieldError(form.querySelector(".categories"), "Select one category.");
      return;
    }

    if (!isValidMoneyInput(amountRaw)) {
      showFieldError(amountEl, "Invalid value. Use only numbers with a comma or dot.");
      return;
    }

    const amount = normalizeMoneyInput(amountRaw);

    // Sheet Personal: Date; Category; Amount; Comments
    const values = [date, category, amount, comment];

    try {
      await submitToSheet(values, "Personal");
      showFormMessage(form, "Saved successfully.", "success");
      form.reset();
      form.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));
      setTodayOnInput(form.querySelector("input[name='date']"));
    } catch (err) {
      console.error(err);
      showFormMessage(form, "Save failed. Please try again.", "error");
    }
  });
}

function wireFamilyForm() {
  const form = document.getElementById("form-family");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearInlineErrors(form);

    const date = form.querySelector("input[name='date']")?.value || "";
    const category = form.querySelector(".category.selected")?.textContent?.trim() || "";
    const amountEl = form.querySelector("input[name='amount']");
    const amountRaw = amountEl?.value?.trim() || "";
    const comment = form.querySelector("input[name='comment']")?.value || "";

    if (!category) {
      showFieldError(form.querySelector(".categories"), "Select one category.");
      return;
    }

    if (!isValidMoneyInput(amountRaw)) {
      showFieldError(amountEl, "Invalid value. Use only numbers with a comma or dot.");
      return;
    }

    const amount = normalizeMoneyInput(amountRaw);
    const type = (document.getElementById("family-type")?.value || "").trim();

    // Sheet Family: Date; Category; Amount; Comments; Type
    const values = [date, category, amount, comment, type];

    try {
      await submitToSheet(values, "Family");
      showFormMessage(form, "Saved successfully.", "success");

      form.reset();
      form.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));

      const groceryIconsEl = document.getElementById("grocery-icons");
      if (groceryIconsEl) groceryIconsEl.style.display = "none";

      clearFamilyTypeUI();
      setTodayOnInput(form.querySelector("input[name='date']"));
    } catch (err) {
      console.error(err);
      showFormMessage(form, "Save failed. Please try again.", "error");
    }
  });
}

function wireUtilitiesForm() {
  const form = document.getElementById("form-utilities");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearInlineErrors(form);

    const date = form.querySelector("input[name='date']")?.value || "";

    // Utilities categories are icons, so selected element may have empty text.
    const selected = form.querySelector(".category.selected");
    const category = selected?.textContent?.trim() || selected?.dataset?.value?.trim() || "";

    // In your HTML "Value" input is named amount, not value
    const valueEl = form.querySelector("input[name='amount']");
    const valueRaw = valueEl?.value?.trim() || "";
    const comment = form.querySelector("input[name='comment']")?.value || "";

    if (!category) {
      showFieldError(form.querySelector(".categories"), "Select one category.");
      return;
    }

    if (!isValidMoneyInput(valueRaw)) {
      showFieldError(valueEl, "Invalid value. Use only numbers with a comma or dot.");
      return;
    }

    const value = normalizeMoneyInput(valueRaw);

    // Sheet Utilities: Date; Category; Value; Comments
    const values = [date, category, value, comment];

    try {
      await submitToSheet(values, "Utilities");
      showFormMessage(form, "Saved successfully.", "success");
      form.reset();
      form.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));
      setTodayOnInput(form.querySelector("input[name='date']"));
    } catch (err) {
      console.error(err);
      showFormMessage(form, "Save failed. Please try again.", "error");
    }
  });
}

function wireIncomeForm() {
  const form = document.getElementById("form-income");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearInlineErrors(form);

    const dateInput = form.querySelector("input[name='date']");
    const date = (dateInput?.value || "").trim() || new Date().toISOString().split("T")[0];

    const salaryEl = form.querySelector("input[name='salary']");
    const mealEl = form.querySelector("input[name='mealAllowances']");
    const extraEl = form.querySelector("input[name='extra']");

    const salaryRaw = salaryEl?.value?.trim() || "";
    const mealRaw = mealEl?.value?.trim() || "";
    const extraRaw = extraEl?.value?.trim() || "";

    const comment = form.querySelector("input[name='comment']")?.value || "";

    // Validate format (strict)
    let ok = true;
    if (!isValidMoneyInput(salaryRaw)) {
      showFieldError(salaryEl, "Invalid value. Use only numbers with a comma or dot.");
      ok = false;
    }
    if (!isValidMoneyInput(mealRaw)) {
      showFieldError(mealEl, "Invalid value. Use only numbers with a comma or dot.");
      ok = false;
    }
    if (!isValidMoneyInput(extraRaw)) {
      showFieldError(extraEl, "Invalid value. Use only numbers with a comma or dot.");
      ok = false;
    }
    if (!ok) return;

    // Rule: sum must be > 0
    const salaryNum = moneyToNumber(salaryRaw);
    const mealNum = moneyToNumber(mealRaw);
    const extraNum = moneyToNumber(extraRaw);

    if ([salaryNum, mealNum, extraNum].some((n) => Number.isNaN(n))) {
      showFormMessage(form, "Valores inválidos.", "error");
      return;
    }

    const total = salaryNum + mealNum + extraNum;
    if (!(total > 0)) {
      showFormMessage(form, "Please ensure that at least one income type has value.", "error");
      showFieldError(salaryEl, "");
      showFieldError(mealEl, "");
      showFieldError(extraEl, "");
      return;
    }

    // Store with dot only
    const salary = normalizeMoneyInput(salaryRaw);
    const mealAllowances = normalizeMoneyInput(mealRaw);
    const extra = normalizeMoneyInput(extraRaw);

    // Sheet Income: Timestamp(auto); Date; Salary; Meal Allowances; Extra; Comments
    const values = [date, salary, mealAllowances, extra, comment];

    try {
      await submitToSheet(values, "Income");
      showFormMessage(form, "Saved successfully.", "success");
      form.reset();
      setTodayOnInput(dateInput);
    } catch (err) {
      console.error(err);
      showFormMessage(form, "Save failed. Please try again.", "error");
    }
  });
}

function wireJoanaForm() {
  const form = document.getElementById("form-joana");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearInlineErrors(form);

    const date = form.querySelector("input[name='date']")?.value || "";
    const category = form.querySelector(".category.selected")?.textContent?.trim() || "";
    const amountEl = form.querySelector("input[name='amount']");
    const amountRaw = amountEl?.value?.trim() || "";
    const comment = form.querySelector("input[name='comment']")?.value || "";

    if (!category) {
      showFieldError(form.querySelector(".categories"), "Select one category.");
      return;
    }

    if (!isValidMoneyInput(amountRaw)) {
      showFieldError(amountEl, "Invalid value. Use only numbers with a comma or dot.");
      return;
    }

    const amount = normalizeMoneyInput(amountRaw);

    // Sheet Joana: Date; Category; Amount; Comments
    const values = [date, category, amount, comment];

    try {
      await submitToSheet(values, "Joana");
      showFormMessage(form, "Saved successfully.", "success");
      form.reset();
      form.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));
      setTodayOnInput(form.querySelector("input[name='date']"));
    } catch (err) {
      console.error(err);
      showFormMessage(form, "Save failed. Please try again.", "error");
    }
  });
}

/* ==============================
   9) Boot
   ============================== */

document.addEventListener("DOMContentLoaded", () => {
  // 1) Abre sempre a view inicial fixa (SEM deep linking)
  // Troca "personal" se quiseres outra como default.
  navigate("personal");

  // 2) Default today's date on all date inputs
  document.querySelectorAll("input[type='date']").forEach(setTodayOnInput);

  // 3) Shared UI wiring
  wireCategorySelection();
  wireFamilyGroceryIcons();

  // 4) Form wiring
  wirePersonalForm();
  wireFamilyForm();
  wireUtilitiesForm();
  wireIncomeForm();
  wireJoanaForm(); // se removeste Joana do HTML, isto simplesmente não faz nada

  // 5) Safety: ensure Family Type UI starts clean
  clearFamilyTypeUI();
});
