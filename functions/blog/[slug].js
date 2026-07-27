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
  const gallery = Array.isArray(post.images) ? post.images.filter(Boolean) : [];
  const video = post.video || "";
  const hasMedia = gallery.length > 0 || !!video;

  const carousel = gallery.length
    ? `
    <div class="carousel post-carousel">
      <div class="carousel-track">
        ${gallery
          .map(
            (src) =>
              `<div class="carousel-slide"><img src="${src}" alt="${escapeHtml(post.title)}" loading="lazy" decoding="async" /></div>`
          )
          .join("")}
      </div>
      ${gallery.length > 1 ? `<button class="carousel-btn prev" type="button" aria-label="Anterior">&#8249;</button><button class="carousel-btn next" type="button" aria-label="Próxima">&#8250;</button><div class="carousel-dots"></div>` : ""}
    </div>`
    : "";

  const videoBlock = video
    ? `<video class="post-video" controls preload="metadata"${post.image ? ` poster="${post.image}"` : ""}><source src="${video}" /></video>`
    : "";

  const bodyContent = hasMedia
    ? `
<div class="post-layout">
  <article class="post-body">
    ${paragraphs(post.content)}
  </article>
  <aside class="post-media">
    ${carousel}
    ${videoBlock}
  </aside>
</div>`
    : `
<article class="post-body">
  ${paragraphs(post.content)}
</article>`;

  const carouselScript = gallery.length > 1
    ? `
<script>
(function(){
  document.querySelectorAll('.post-carousel').forEach(function(c){
    var track=c.querySelector('.carousel-track');
    var slides=c.querySelectorAll('.carousel-slide');
    var prev=c.querySelector('.carousel-btn.prev');
    var next=c.querySelector('.carousel-btn.next');
    var dotsWrap=c.querySelector('.carousel-dots');
    if(slides.length<2)return;
    var i=0;
    slides.forEach(function(_,idx){
      var d=document.createElement('button');d.type='button';d.className='carousel-dot'+(idx===0?' active':'');
      d.addEventListener('click',function(){go(idx);});dotsWrap.appendChild(d);
    });
    function go(n){i=(n+slides.length)%slides.length;track.style.transform='translateX(-'+(i*100)+'%)';
      dotsWrap.querySelectorAll('.carousel-dot').forEach(function(dd,di){dd.classList.toggle('active',di===i);});}
    prev.addEventListener('click',function(){go(i-1);});
    next.addEventListener('click',function(){go(i+1);});
    var sx=null;
    track.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;},{passive:true});
    track.addEventListener('touchend',function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>40)go(i+(dx<0?1:-1));sx=null;});
  });
})();
</script>`
    : "";

  const body = `
<section class="post-hero">
  <div class="container">
    <div class="date">${post.category ? escapeHtml(post.category) + " · " : ""}${formatDate(post.date)}</div>
    <h1>${escapeHtml(post.title)}</h1>
  </div>
</section>
${post.image ? `<div class="post-cover"><img src="${post.image}" alt="${escapeHtml(post.title)}" /></div>` : ""}
${bodyContent}
<div class="post-back-wrap"><a class="post-back" href="/blog">← Voltar para o blog</a></div>
${carouselScript}
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
