import { layout, formatDate, escapeHtml } from "../_shared.js";

export async function onRequestGet({ env }) {
  const indexRaw = await env.BLOG_KV.get("post-index");
  const slugs = indexRaw ? JSON.parse(indexRaw) : [];

  const posts = (
    await Promise.all(slugs.map((slug) => env.BLOG_KV.get(`post:${slug}`)))
  )
    .filter(Boolean)
    .map((raw) => JSON.parse(raw));

  const categoriesRaw = await env.BLOG_KV.get("categories");
  const categories = categoriesRaw ? JSON.parse(categoriesRaw) : [];

  const card = (p) => `
      <a class="blog-card" href="/blog/${p.slug}">
        <div class="thumb">
          ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy" decoding="async" />` : ""}
        </div>
        <div class="body">
          <div class="date">${formatDate(p.date)}</div>
          <h2>${escapeHtml(p.title)}</h2>
          <p>${escapeHtml(p.content.slice(0, 140))}${p.content.length > 140 ? "…" : ""}</p>
          <span class="read-more">Ler mais →</span>
        </div>
      </a>`;

  // ordem das seções: as cadastradas primeiro, depois qualquer outra que apareça nos posts, "Outros" por último
  const order = [];
  categories.forEach((c) => { if (!order.includes(c)) order.push(c); });
  posts.forEach((p) => { if (p.category && !order.includes(p.category)) order.push(p.category); });

  const groups = [];
  order.forEach((cat) => {
    const inCat = posts.filter((p) => (p.category || "") === cat);
    if (inCat.length) groups.push({ name: cat, posts: inCat });
  });
  const semSecao = posts.filter((p) => !p.category);
  if (semSecao.length) groups.push({ name: "Outros", posts: semSecao });

  const sections = posts.length
    ? groups
        .map(
          (g) => `
  <section class="blog-section">
    <div class="section-label">Seção</div>
    <h2>${escapeHtml(g.name)}</h2>
    <div class="blog-grid">
      ${g.posts.map(card).join("\n")}
    </div>
  </section>`
        )
        .join("\n")
    : `<div class="blog-empty">Em breve, novas histórias da estrada por aqui.</div>`;

  const body = `
<section class="blog-hero">
  <div class="section-label">Blog</div>
  <h1>Histórias da Texas Hill</h1>
  <p>Atrativos da Serra Catarinense, novidades da pousada e histórias de quem já passou por aqui.</p>
</section>
<div class="blog-sections">
  ${sections}
</div>
`;

  return new Response(
    layout({
      title: "Blog — Texas Hill Pousada",
      description: "Histórias, novidades e atrativos da Serra Catarinense contados pela Texas Hill Pousada.",
      body,
    }),
    { headers: { "content-type": "text/html;charset=UTF-8" } }
  );
}
