import { layout } from "./_shared.js";

export async function onRequestGet() {
  const body = `
<section class="admin-wrap">
  <h1>Publicar no blog</h1>
  <p>Preencha os campos abaixo e clique em publicar.</p>

  <div class="admin-card">
    <form id="publishForm">
      <label for="password">Senha</label>
      <input type="password" id="password" name="password" required />

      <label for="title">Título da postagem</label>
      <input type="text" id="title" name="title" required />

      <label for="image">Foto de capa</label>
      <input type="file" id="image" name="image" accept="image/*" />

      <label for="content">Texto</label>
      <textarea id="content" name="content" placeholder="Escreva o texto da postagem aqui. Pule uma linha em branco para separar parágrafos." required></textarea>

      <button type="submit" class="admin-submit" id="submitBtn">Publicar</button>
      <div class="admin-msg" id="msg"></div>
    </form>
  </div>
</section>

<script>
  const form = document.getElementById("publishForm");
  const msg = document.getElementById("msg");
  const btn = document.getElementById("submitBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    btn.disabled = true;
    btn.textContent = "Publicando...";
    msg.className = "admin-msg";
    msg.textContent = "";

    try {
      const res = await fetch("/api/publish", { method: "POST", body: new FormData(form) });
      const data = await res.json();

      if (data.ok) {
        msg.className = "admin-msg ok";
        msg.textContent = "Postagem publicada com sucesso!";
        form.reset();
      } else {
        msg.className = "admin-msg error";
        msg.textContent = data.error || "Não foi possível publicar.";
      }
    } catch (err) {
      msg.className = "admin-msg error";
      msg.textContent = "Erro de conexão. Tente novamente.";
    } finally {
      btn.disabled = false;
      btn.textContent = "Publicar";
    }
  });
</script>
`;

  return new Response(
    layout({ title: "Admin — Blog Texas Hill", body }),
    { headers: { "content-type": "text/html;charset=UTF-8" } }
  );
}
