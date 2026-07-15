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

  return new Response(JSON.stringify({ ok: true, posts, categories }), {
    headers: { "content-type": "application/json" },
  });
}
