const darkModeToggle = document.getElementById("darkModeToggle");
const moonIcon = document.getElementById("moonIcon");
const sunIcon = document.getElementById("sunIcon");

// Alternar o modo escuro
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  // Alternar visibilidade dos ícones
  const isDarkMode = document.body.classList.contains("dark-mode");
  moonIcon.style.display = isDarkMode ? "none" : "inline";
  sunIcon.style.display = isDarkMode ? "inline" : "none";

  // Salvar preferência no localStorage
  localStorage.setItem("darkMode", isDarkMode ? "enabled" : "disabled");
});

// Aplicar preferência salva
window.addEventListener("DOMContentLoaded", () => {
  const darkMode = localStorage.getItem("darkMode");
  if (darkMode === "enabled") {
    document.body.classList.add("dark-mode");
    moonIcon.style.display = "none";
    sunIcon.style.display = "inline";
  }
});
