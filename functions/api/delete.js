export async function onRequestPost({ request, env }) {
  try {
    const form = await request.formData();
    const password = (form.get("password") || "").toString();
    const slug = (form.get("slug") || "").toString().trim();

    if (!env.ADMIN_PASSWORD || password !== env.ADMIN_PASSWORD) {
      return json({ ok: false, error: "Senha incorreta." }, 401);
    }
    if (!slug) return json({ ok: false, error: "Post não informado." }, 400);

    await env.BLOG_KV.delete(`post:${slug}`);

    const indexRaw = await env.BLOG_KV.get("post-index");
    const index = indexRaw ? JSON.parse(indexRaw) : [];
    await env.BLOG_KV.put(
      "post-index",
      JSON.stringify(index.filter((s) => s !== slug))
    );

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: "Erro ao excluir: " + err.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
