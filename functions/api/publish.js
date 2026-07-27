import { slugify } from "../_shared.js";

const MAX_VIDEO_MB = 90;   // limite do corpo da requisição no Cloudflare é ~100 MB
const MAX_IMAGE_MB = 12;

export async function onRequestPost({ request, env }) {
  try {
    const form = await request.formData();
    const password = form.get("password") || "";

    if (!env.ADMIN_PASSWORD || password !== env.ADMIN_PASSWORD) {
      return json({ ok: false, error: "Senha incorreta." }, 401);
    }

    const title = (form.get("title") || "").toString().trim();
    const content = (form.get("content") || "").toString().trim();
    const category = (form.get("category") || "").toString().trim();
    const editingSlug = (form.get("editingSlug") || "").toString().trim();
    const existingImage = (form.get("existingImage") || "").toString().trim();
    const existingVideo = (form.get("existingVideo") || "").toString().trim();
    const existingImagesRaw = (form.get("existingImages") || "").toString().trim();
    const image = form.get("image");
    const video = form.get("video");
    const galleryFiles = form
      .getAll("gallery")
      .filter((f) => f && typeof f === "object" && f.size > 0);

    if (!title || !content) {
      return json({ ok: false, error: "Preencha título e texto." }, 400);
    }

    if (!env.BLOG_IMAGES && (hasFile(image) || hasFile(video) || galleryFiles.length)) {
      return json({ ok: false, error: "Armazenamento de arquivos não configurado." }, 500);
    }

    // valida tamanhos antes de subir qualquer coisa
    if (hasFile(image) && image.size > MAX_IMAGE_MB * 1024 * 1024) {
      return json({ ok: false, error: `A foto de capa passa de ${MAX_IMAGE_MB} MB.` }, 400);
    }
    for (const g of galleryFiles) {
      if (g.size > MAX_IMAGE_MB * 1024 * 1024) {
        return json({ ok: false, error: `Uma das imagens da galeria passa de ${MAX_IMAGE_MB} MB.` }, 400);
      }
    }
    if (hasFile(video) && video.size > MAX_VIDEO_MB * 1024 * 1024) {
      return json({ ok: false, error: `O vídeo passa do limite de ${MAX_VIDEO_MB} MB. Compacte ou encurte o vídeo.` }, 400);
    }

    let slug;
    let date;
    let existingPost = null;

    if (editingSlug) {
      const raw = await env.BLOG_KV.get(`post:${editingSlug}`);
      if (!raw) return json({ ok: false, error: "Post não encontrado para edição." }, 404);
      existingPost = JSON.parse(raw);
      slug = editingSlug;
      date = existingPost.date;
    } else {
      const baseSlug = slugify(title) || "post";
      slug = baseSlug;
      let i = 2;
      while (await env.BLOG_KV.get(`post:${slug}`)) {
        slug = `${baseSlug}-${i++}`;
      }
      date = new Date().toISOString();
    }

    // capa
    let imageUrl = existingImage || (existingPost ? existingPost.image : "") || "";
    if (hasFile(image)) {
      imageUrl = await uploadToR2(env, image, slug);
    }

    // galeria: se subiu novas fotos, substitui; senão mantém as existentes
    let images = [];
    if (galleryFiles.length) {
      for (const g of galleryFiles) {
        images.push(await uploadToR2(env, g, slug));
      }
    } else if (existingImagesRaw) {
      try { images = JSON.parse(existingImagesRaw); } catch { images = []; }
    } else if (existingPost && Array.isArray(existingPost.images)) {
      images = existingPost.images;
    }

    // vídeo
    let videoUrl = existingVideo || (existingPost ? existingPost.video : "") || "";
    if (hasFile(video)) {
      videoUrl = await uploadToR2(env, video, slug);
    }

    const post = { slug, title, content, image: imageUrl, images, video: videoUrl, date, category };
    await env.BLOG_KV.put(`post:${slug}`, JSON.stringify(post));

    if (!editingSlug) {
      const indexRaw = await env.BLOG_KV.get("post-index");
      const index = indexRaw ? JSON.parse(indexRaw) : [];
      index.unshift(slug);
      await env.BLOG_KV.put("post-index", JSON.stringify(index));
    }

    if (category) {
      const categoriesRaw = await env.BLOG_KV.get("categories");
      const categories = categoriesRaw ? JSON.parse(categoriesRaw) : [];
      if (!categories.includes(category)) {
        categories.push(category);
        await env.BLOG_KV.put("categories", JSON.stringify(categories));
      }
    }

    return json({ ok: true, slug, url: `/blog/${slug}` });
  } catch (err) {
    return json({ ok: false, error: "Erro ao publicar: " + err.message }, 500);
  }
}

function hasFile(f) {
  return f && typeof f === "object" && typeof f.size === "number" && f.size > 0;
}

async function uploadToR2(env, file, slug) {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const rand = Math.random().toString(36).slice(2, 7);
  const key = `${slug}-${Date.now()}-${rand}.${ext || "bin"}`;
  await env.BLOG_IMAGES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });
  return `${env.BLOG_IMAGES_PUBLIC_URL}/${key}`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
