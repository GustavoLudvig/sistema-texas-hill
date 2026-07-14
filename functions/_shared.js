export function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function slugify(title) {
  return title
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function paragraphs(text = "") {
  return text
    .split(/\n\s*\n/)
    .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

export function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

const HEAD = `
<link rel="icon" type="image/jpeg" href="/public/logo.jfif" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Rye&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/css/style.css" />
<link rel="stylesheet" href="/css/blog.css" />
`;

const HEADER = `
<header class="site-header">
  <a href="/" class="logo">
    <img src="/public/logo.jfif" alt="Texas Hill Pousada" />
    <span>Texas Hill</span>
  </a>
  <button class="nav-toggle" id="navToggle" aria-label="Abrir menu">&#9776;</button>
  <nav class="site-nav" id="siteNav">
    <a href="/#historia">História</a>
    <a href="/#construcao">Construção</a>
    <a href="/#cultura-estrada">Cultura da Estrada</a>
    <a href="/#experiencias">Experiências</a>
    <a href="/#mapa">Mapa</a>
    <a href="/blog">Blog</a>
  </nav>
  <a href="https://reservas.texashillpousada.com.br" class="btn-reservar">Reservar</a>
</header>
<script>
  document.addEventListener("DOMContentLoaded", () => {
    const t = document.getElementById("navToggle");
    const n = document.getElementById("siteNav");
    if (t && n) t.addEventListener("click", () => n.classList.toggle("open"));
  });
</script>
`;

const FOOTER = `
<footer>
  <p>&copy; ${new Date().getFullYear()} Texas Hill Pousada — Urubici, Serra Catarinense</p>
  <p><a href="https://reservas.texashillpousada.com.br">reservas.texashillpousada.com.br</a></p>
</footer>
`;

export function layout({ title, description = "", body }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
${HEAD}
</head>
<body>
${HEADER}
${body}
${FOOTER}
</body>
</html>`;
}
