// Navigation logic: show selected view and hide others
function navigate(viewId) {
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById(viewId).classList.add('active');
}

// Set default date to today in all date inputs
window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(input => {
    input.value = today;
  });
});

// Category selection logic
document.addEventListener("DOMContentLoaded", function () {
  const categories = document.querySelectorAll(".category");

  categories.forEach(category => {
    category.addEventListener("click", () => {
      // Remove 'selected' from all categories
      categories.forEach(cat => cat.classList.remove("selected"));
      // Add 'selected' to the clicked one
      category.classList.add("selected");
    });
  });
});

// Value with 2 decimals
document.querySelectorAll('input[type="number"]').forEach(input => {
  input.addEventListener('blur', () => {
    let value = parseFloat(input.value);
    if (!isNaN(value)) {
      input.value = value.toFixed(2);
    }
  });
});

