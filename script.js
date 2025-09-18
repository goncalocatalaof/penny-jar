// script.js

function navigate(viewId) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(viewId).classList.add("active");
}

// Utility function for posting data to API
async function submitToSheet(values, sheetName) {
  const res = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values, sheetName }),
  });
  if (!res.ok) throw new Error("Failed to save");
  return res.json();
}

// ----- CATEGORY SELECTION -----
document.querySelectorAll(".categories").forEach((container) => {
  container.addEventListener("click", (e) => {
    const categoryDiv = e.target.closest(".category");
    if (!categoryDiv) return;

    // Remove previous selection
    container.querySelectorAll(".category").forEach((c) => c.classList.remove("selected"));
    categoryDiv.classList.add("selected");

    // Utilities special case → update hidden input
    if (container.closest("#utilities")) {
      document.getElementById("utility-category").value = categoryDiv.dataset.value || "";
    }
  });
});

// ----- PERSONAL FORM -----
document.getElementById("form-personal").addEventListener("submit", async (e) => {
  e.preventDefault();

  const date = document.getElementById("personal-date").value;
  const value = document.getElementById("personal-value").value;
  const category = document.querySelector("#form-personal .category.selected")?.textContent || "";
  const comment = document.getElementById("personal-comment").value || "";

  if (!category) {
    alert("Please select a category");
    return;
  }

  const values = [date, value, category, comment];

  try {
    await submitToSheet(values, "Personal");
    alert("Saved to Personal!");
    e.target.reset();
    document.querySelectorAll("#form-personal .category").forEach((c) => c.classList.remove("selected"));
  } catch (err) {
    alert("Error saving personal expense");
    console.error(err);
  }
});

// ----- FAMILY FORM -----
document.getElementById("form-family").addEventListener("submit", async (e) => {
  e.preventDefault();

  const date = document.getElementById("family-date").value;
  const value = document.getElementById("family-value").value;
  const category = document.querySelector("#form-family .category.selected")?.textContent || "";
  const comment = document.getElementById("family-comment").value || "";

  if (!category) {
    alert("Please select a category");
    return;
  }

  const values = [date, value, category, comment];

  try {
    await submitToSheet(values, "Family");
    alert("Saved to Family!");
    e.target.reset();
    document.querySelectorAll("#form-family .category").forEach((c) => c.classList.remove("selected"));
  } catch (err) {
    alert("Error saving family expense");
    console.error(err);
  }
});

// ----- UTILITIES FORM -----
document.getElementById("form-utilities").addEventListener("submit", async (e) => {
  e.preventDefault();

  const date = document.getElementById("utilities-date").value;
  const value = document.getElementById("utilities-value").value;
  const category = document.getElementById("utility-category").value;
  const consumption = document.getElementById("utilities-consumption").value;
  const comment = document.getElementById("utilities-comment").value || "";

  if (!category) {
    alert("Please select a utility category");
    return;
  }

  const values = [date, category, value, consumption, comment];

  try {
    await submitToSheet(values, "Utilities");
    alert("Saved to Utilities!");
    e.target.reset();
    document.getElementById("utility-category").value = "";
    document.querySelectorAll("#form-utilities .category").forEach((c) => c.classList.remove("selected"));
  } catch (err) {
    alert("Error saving utility expense");
    console.error(err);
  }
});
