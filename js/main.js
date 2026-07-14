document.getElementById("ano").textContent = new Date().getFullYear();

const reservasUrl = "https://reservas.texashillpousada.com.br";

document.querySelectorAll("#datas-field, #hospedes-field").forEach((el) => {
  el.addEventListener("click", () => {
    window.location.href = reservasUrl;
  });
});

const navToggle = document.getElementById("navToggle");
const siteNav = document.getElementById("siteNav");

navToggle.addEventListener("click", () => {
  siteNav.classList.toggle("open");
});

siteNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => siteNav.classList.remove("open"));
});
