import { layout, formatDate, paragraphs, escapeHtml } from "../_shared.js";

export async function onRequestGet({ params, env }) {
  const raw = await env.BLOG_KV.get(`post:${params.slug}`);

  if (!raw) {
    return new Response(
      layout({
        title: "Post não encontrado — Texas Hill Pousada",
        body: `<section class="admin-wrap" style="text-align:center;">
          <h1>Post não encontrado</h1>
          <p><a class="post-back" href="/blog">← Voltar para o blog</a></p>
        </section>`,
      }),
      { status: 404, headers: { "content-type": "text/html;charset=UTF-8" } }
    );
  }

  const post = JSON.parse(raw);

  const body = `
<section class="post-hero">
  <div class="container">
    <div class="date">${formatDate(post.date)}</div>
    <h1>${escapeHtml(post.title)}</h1>
  </div>
</section>
${post.image ? `<div class="post-cover"><img src="${post.image}" alt="${escapeHtml(post.title)}" /></div>` : ""}
<article class="post-body">
  ${paragraphs(post.content)}
</article>
<div class="post-back-wrap"><a class="post-back" href="/blog">← Voltar para o blog</a></div>
`;

  return new Response(
    layout({
      title: `${post.title} — Texas Hill Pousada`,
      description: post.content.slice(0, 150),
      body,
    }),
    { headers: { "content-type": "text/html;charset=UTF-8" } }
  );
}
