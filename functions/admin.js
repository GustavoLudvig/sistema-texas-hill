import { layout } from "./_shared.js";

export async function onRequestGet() {
  const body = `
<section class="admin-wrap">
  <h1 id="formTitle">Publicar no blog</h1>
  <p>Preencha os campos abaixo e clique em publicar.</p>

  <div class="admin-card">
    <form id="publishForm">
      <input type="hidden" id="editingSlug" name="editingSlug" value="" />
      <input type="hidden" id="existingImage" name="existingImage" value="" />
      <input type="hidden" id="existingImages" name="existingImages" value="" />
      <input type="hidden" id="existingVideo" name="existingVideo" value="" />

      <label for="password">Senha</label>
      <input type="password" id="password" name="password" required />

      <label for="title">Título da postagem</label>
      <input type="text" id="title" name="title" required />

      <label for="category">Seção</label>
      <select id="category"></select>
      <input type="text" id="newCategoryInput" placeholder="Nome da nova seção (ex.: Nossas cabanas)" style="display:none; margin-top:10px;" />

      <label for="image">Foto de capa</label>
      <input type="file" id="image" name="image" accept="image/*" />
      <div style="font-size:.82rem; color:var(--text-soft); margin-top:6px; line-height:1.5;">
        Opcional. Use fotos na <strong>horizontal (paisagem)</strong>, no formato <strong>16:9</strong> e com boa qualidade (ex.: 1600&times;900px). A foto aparece no topo da postagem — fotos em pé (vertical) ficam cortadas.
      </div>
      <div id="currentImageHint" style="display:none; font-size:.82rem; color:var(--text-soft); margin-top:6px;">
        Já existe uma foto neste post. Só escolha um arquivo aqui se quiser trocá-la.
      </div>

      <label for="gallery">Mais imagens (galeria)</label>
      <input type="file" id="gallery" name="gallery" accept="image/*" multiple />
      <div style="font-size:.82rem; color:var(--text-soft); margin-top:6px; line-height:1.5;">
        Opcional. Selecione <strong>várias fotos de uma vez</strong> — elas aparecem num <strong>carrossel ao lado do texto</strong>. Use fotos na horizontal, boa qualidade.
      </div>
      <div id="currentGalleryHint" style="display:none; font-size:.82rem; color:var(--text-soft); margin-top:6px;">
        Este post já tem fotos na galeria. Só escolha arquivos aqui se quiser <strong>substituí-las</strong>.
      </div>

      <label for="video">Vídeo (opcional)</label>
      <input type="file" id="video" name="video" accept="video/*" />
      <div style="font-size:.82rem; color:var(--text-soft); margin-top:6px; line-height:1.5;">
        Opcional. Máximo <strong>90 MB</strong>. Prefira vídeos <strong>curtos (até ~1 min) e já compactados</strong>. Ele aparece na postagem com botão de play.
      </div>
      <div id="currentVideoHint" style="display:none; font-size:.82rem; color:var(--text-soft); margin-top:6px;">
        Este post já tem um vídeo. Só escolha um arquivo aqui se quiser trocá-lo.
      </div>

      <label for="content">Texto</label>
      <textarea id="content" name="content" placeholder="Escreva o texto da postagem aqui. Pule uma linha em branco para separar parágrafos." required></textarea>

      <button type="submit" class="admin-submit" id="submitBtn">Publicar</button>
      <button type="button" class="admin-submit" id="cancelEditBtn" style="display:none; background:var(--secondary); margin-top:10px;">Cancelar edição</button>
      <div class="admin-msg" id="msg"></div>
    </form>
  </div>

  <h1 style="margin-top:60px;">Postagens publicadas</h1>
  <div class="admin-card" id="postsList">
    <p style="color:var(--text-soft);">Carregando...</p>
  </div>
</section>

<script>
  const NEW_CATEGORY_VALUE = "__new__";

  const form = document.getElementById("publishForm");
  const msg = document.getElementById("msg");
  const btn = document.getElementById("submitBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const formTitle = document.getElementById("formTitle");
  const categorySelect = document.getElementById("category");
  const newCategoryInput = document.getElementById("newCategoryInput");
  const editingSlugInput = document.getElementById("editingSlug");
  const existingImageInput = document.getElementById("existingImage");
  const existingImagesInput = document.getElementById("existingImages");
  const existingVideoInput = document.getElementById("existingVideo");
  const currentImageHint = document.getElementById("currentImageHint");
  const currentGalleryHint = document.getElementById("currentGalleryHint");
  const currentVideoHint = document.getElementById("currentVideoHint");
  const galleryInput = document.getElementById("gallery");
  const videoInput = document.getElementById("video");
  const postsList = document.getElementById("postsList");

  const MAX_VIDEO_MB = 90;

  let allPosts = [];
  let allCategories = [];

  function renderCategoryOptions(selected) {
    categorySelect.innerHTML = "";
    allCategories.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      if (c === selected) opt.selected = true;
      categorySelect.appendChild(opt);
    });
    const newOpt = document.createElement("option");
    newOpt.value = NEW_CATEGORY_VALUE;
    newOpt.textContent = "+ Criar nova seção";
    categorySelect.appendChild(newOpt);

    if (selected && !allCategories.includes(selected)) {
      categorySelect.value = NEW_CATEGORY_VALUE;
      newCategoryInput.style.display = "block";
      newCategoryInput.value = selected;
    }
  }

  categorySelect.addEventListener("change", () => {
    if (categorySelect.value === NEW_CATEGORY_VALUE) {
      newCategoryInput.style.display = "block";
      newCategoryInput.focus();
    } else {
      newCategoryInput.style.display = "none";
      newCategoryInput.value = "";
    }
  });

  function renderPostsList() {
    if (!allPosts.length) {
      postsList.innerHTML = '<p style="color:var(--text-soft);">Nenhuma postagem publicada ainda.</p>';
      return;
    }
    postsList.innerHTML = allPosts
      .map(
        (p) => \`
        <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid var(--border);">
          <div>
            <strong>\${escapeHtml(p.title)}</strong><br>
            <span style="font-size:.82rem; color:var(--text-soft);">\${p.category ? escapeHtml(p.category) + " · " : ""}\${new Date(p.date).toLocaleDateString("pt-BR")}</span>
          </div>
          <div style="display:flex; gap:10px;">
            <button type="button" class="edit-btn" data-slug="\${p.slug}" style="background:none; border:1px solid var(--border); border-radius:6px; padding:8px 14px; cursor:pointer; color:var(--text);">Editar</button>
            <button type="button" class="delete-btn" data-slug="\${p.slug}" style="background:none; border:1px solid var(--accent); border-radius:6px; padding:8px 14px; cursor:pointer; color:var(--accent);">Excluir</button>
          </div>
        </div>\`
      )
      .join("");

    postsList.querySelectorAll(".edit-btn").forEach((b) =>
      b.addEventListener("click", () => startEdit(b.dataset.slug))
    );
    postsList.querySelectorAll(".delete-btn").forEach((b) =>
      b.addEventListener("click", () => deletePost(b.dataset.slug))
    );
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function startEdit(slug) {
    const post = allPosts.find((p) => p.slug === slug);
    if (!post) return;

    formTitle.textContent = "Editar postagem";
    document.getElementById("title").value = post.title;
    document.getElementById("content").value = post.content;
    editingSlugInput.value = post.slug;
    existingImageInput.value = post.image || "";
    existingImagesInput.value = JSON.stringify(post.images || []);
    existingVideoInput.value = post.video || "";
    renderCategoryOptions(post.category || "");

    currentImageHint.style.display = post.image ? "block" : "none";
    currentGalleryHint.style.display = (post.images && post.images.length) ? "block" : "none";
    currentVideoHint.style.display = post.video ? "block" : "none";

    btn.textContent = "Salvar alterações";
    cancelEditBtn.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    form.reset();
    formTitle.textContent = "Publicar no blog";
    editingSlugInput.value = "";
    existingImageInput.value = "";
    existingImagesInput.value = "";
    existingVideoInput.value = "";
    currentImageHint.style.display = "none";
    currentGalleryHint.style.display = "none";
    currentVideoHint.style.display = "none";
    btn.textContent = "Publicar";
    cancelEditBtn.style.display = "none";
    renderCategoryOptions("");
  }

  cancelEditBtn.addEventListener("click", resetForm);

  async function deletePost(slug) {
    if (!confirm("Tem certeza que quer excluir essa postagem?")) return;
    const password = document.getElementById("password").value;
    if (!password) {
      alert("Digite a senha no campo Senha antes de excluir.");
      return;
    }
    const fd = new FormData();
    fd.append("password", password);
    fd.append("slug", slug);
    const res = await fetch("/api/delete", { method: "POST", body: fd });
    const data = await res.json();
    if (data.ok) {
      await loadPosts();
      if (editingSlugInput.value === slug) resetForm();
    } else {
      alert(data.error || "Não foi possível excluir.");
    }
  }

  async function loadPosts() {
    const res = await fetch("/api/posts");
    const data = await res.json();
    allPosts = data.posts || [];
    allCategories = data.categories || [];
    renderCategoryOptions(categorySelect.value === NEW_CATEGORY_VALUE ? newCategoryInput.value : categorySelect.value);
    renderPostsList();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (videoInput.files[0] && videoInput.files[0].size > MAX_VIDEO_MB * 1024 * 1024) {
      msg.className = "admin-msg error";
      msg.textContent = "O vídeo passa de " + MAX_VIDEO_MB + " MB. Compacte ou encurte o vídeo antes de subir.";
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      return;
    }

    btn.disabled = true;
    const wasEditing = !!editingSlugInput.value;
    btn.textContent = wasEditing ? "Salvando..." : "Publicando...";
    msg.className = "admin-msg";
    msg.textContent = "";

    const fd = new FormData(form);
    const category = categorySelect.value === NEW_CATEGORY_VALUE ? newCategoryInput.value.trim() : categorySelect.value;
    fd.set("category", category);

    try {
      const res = await fetch("/api/publish", { method: "POST", body: fd });
      const data = await res.json();

      if (data.ok) {
        msg.className = "admin-msg ok";
        msg.textContent = wasEditing ? "Postagem atualizada com sucesso!" : "Postagem publicada com sucesso!";
        resetForm();
        await loadPosts();
      } else {
        msg.className = "admin-msg error";
        msg.textContent = data.error || "Não foi possível publicar.";
      }
    } catch (err) {
      msg.className = "admin-msg error";
      msg.textContent = "Erro de conexão. Tente novamente.";
    } finally {
      btn.disabled = false;
      btn.textContent = wasEditing ? "Salvar alterações" : "Publicar";
    }
  });

  loadPosts();
</script>
`;

  return new Response(
    layout({ title: "Admin — Blog Texas Hill", body }),
    { headers: { "content-type": "text/html;charset=UTF-8" } }
  );
}
