import { slugify } from "../_shared.js";

export async function onRequestPost({ request, env }) {
  try {
    const form = await request.formData();
    const password = form.get("password") || "";

    if (!env.ADMIN_PASSWORD || password !== env.ADMIN_PASSWORD) {
      return json({ ok: false, error: "Senha incorreta." }, 401);
    }

    const title = (form.get("title") || "").toString().trim();
    const content = (form.get("content") || "").toString().trim();
    const image = form.get("image");

    if (!title || !content) {
      return json({ ok: false, error: "Preencha título e texto." }, 400);
    }

    let baseSlug = slugify(title) || "post";
    let slug = baseSlug;
    let i = 2;
    while (await env.BLOG_KV.get(`post:${slug}`)) {
      slug = `${baseSlug}-${i++}`;
    }

    let imageUrl = "";
    if (image && typeof image === "object" && image.size > 0) {
      if (!env.BLOG_IMAGES) {
        return json({ ok: false, error: "Armazenamento de imagens não configurado." }, 500);
      }
      const ext = (image.name.split(".").pop() || "jpg").toLowerCase();
      const key = `${slug}-${Date.now()}.${ext}`;
      await env.BLOG_IMAGES.put(key, image.stream(), {
        httpMetadata: { contentType: image.type || "image/jpeg" },
      });
      imageUrl = `${env.BLOG_IMAGES_PUBLIC_URL}/${key}`;
    }

    const post = {
      slug,
      title,
      content,
      image: imageUrl,
      date: new Date().toISOString(),
    };

    await env.BLOG_KV.put(`post:${slug}`, JSON.stringify(post));

    const indexRaw = await env.BLOG_KV.get("post-index");
    const index = indexRaw ? JSON.parse(indexRaw) : [];
    index.unshift(slug);
    await env.BLOG_KV.put("post-index", JSON.stringify(index));

    return json({ ok: true, slug, url: `/blog/${slug}` });
  } catch (err) {
    return json({ ok: false, error: "Erro ao publicar: " + err.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
