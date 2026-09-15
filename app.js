/* SOHOJ NITTALOY - STOREFRONT APP */
const { createClient } = supabase;
const db = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
const grid = document.getElementById("productGrid");
const status = document.getElementById("status");
const search = document.getElementById("searchInput");
const filter = document.getElementById("categoryFilter");
let products = [];

const uiStyle = document.createElement("style");
uiStyle.textContent = `.product-card{height:550px;min-height:550px;max-height:550px;display:flex;flex-direction:column;min-width:0;overflow:hidden}.product-card .productImageWrap{height:220px;min-height:220px;flex:0 0 220px;overflow:hidden}.product-card .content{flex:1;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column}.product-card .productDescription{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;line-clamp:3;overflow:hidden;overflow-wrap:anywhere;max-height:4.8em}.product-card .productActions{margin-top:auto;display:flex;flex-direction:column;gap:6px;min-width:0}.product-card .productActions .btn{width:100%;margin-top:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.videoThumb{position:relative;width:100%;height:100%;padding:0;border:0;background:#000;cursor:pointer;display:block}.videoThumb video{display:block;width:100%;height:100%;object-fit:cover;pointer-events:none}.videoPlay{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:58px;height:58px;display:grid;place-items:center;border-radius:50%;background:#087f5bcc;color:#fff;font-size:24px;padding-left:4px;box-shadow:0 8px 25px #0006;pointer-events:none}.videoThumb:hover .videoPlay{transform:translate(-50%,-50%) scale(1.1)}.videoModal,.productDetailsModal{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;background:#000b;animation:modalFadeIn .18s ease-out}.videoModal:not(.isOpen){display:none}.videoModalContent{position:relative;width:min(94vw,680px);max-height:86vh;display:grid;place-items:center}.videoModal video{display:block;width:100%;max-height:82vh;object-fit:contain;border-radius:12px;background:#000;box-shadow:0 20px 60px #0008}.videoModalClose,.productDetailsClose{position:absolute;right:-14px;top:-48px;width:42px;height:42px;border:0;border-radius:50%;background:#fff;color:#172033;font-size:29px;line-height:1;cursor:pointer;z-index:2}.productDetailsPanel{position:relative;width:min(94vw,960px);height:min(88vh,720px);display:grid;grid-template-columns:minmax(0,1.05fr) minmax(280px,.95fr);background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 24px 80px #0008}.productDetailsMedia{min-width:0;background:#f1f5f9;padding:22px;display:flex;flex-direction:column;gap:12px;justify-content:center;overflow:auto}.productDetailsMedia img,.productDetailsMedia video{display:block;width:100%;max-height:47%;object-fit:contain;border-radius:12px;background:#0f172a}.productDetailsBody{min-width:0;overflow:auto;padding:42px 32px 32px;color:var(--text)}.productDetailsBody h2{margin:8px 0 18px;font-size:clamp(24px,3vw,36px);overflow-wrap:anywhere}.productDetailsBody small{color:var(--g);font-weight:700}.productDetailsPrice{display:flex;align-items:center;gap:10px;margin-bottom:10px}.productDetailsPrice strong{font-size:28px}.productDetailsPrice del{color:#94a3b8}.productDetailsStock{color:var(--muted);font-weight:700}.productDetailsDescription{white-space:pre-wrap;overflow-wrap:anywhere;color:var(--muted);line-height:1.75;margin:22px 0}.productDetailsBody .whatsapp{display:block;text-align:center;margin-top:18px}.productDetailsClose{right:14px;top:14px}.productDetailsOpen,.videoModalOpen{overflow:hidden}.dark .productDetailsPanel{background:#18212b;color:#f8fafc}.dark .productDetailsMedia{background:#0f172a}.dark .productDetailsBody{color:#f8fafc}.dark .productDetailsDescription,.dark .productDetailsStock{color:#cbd5e1}.dark .videoModalClose,.dark .productDetailsClose{background:#18212b;color:#fff}@keyframes modalFadeIn{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}@media(max-width:560px){.product-card{height:550px;min-height:550px;max-height:550px}.product-card .productImageWrap{height:205px;min-height:205px;flex-basis:205px}.videoModal,.productDetailsModal{padding:12px}.videoModalContent{width:94vw;max-height:80vh}.videoModal video{max-height:76vh}.videoModalClose{right:0;top:-48px}.productDetailsPanel{width:96vw;height:90vh;grid-template-columns:1fr;grid-template-rows:42% 58%;border-radius:14px}.productDetailsMedia{padding:14px;flex-direction:row;align-items:center;overflow:hidden}.productDetailsMedia img,.productDetailsMedia video{width:50%;max-height:100%}.productDetailsBody{padding:24px 20px 20px}.productDetailsBody h2{font-size:25px}.productDetailsClose{right:10px;top:10px}}}`;
document.head.appendChild(uiStyle);

const navigationStyle = document.createElement("style");
navigationStyle.textContent = `header .nav{gap:28px}header nav#mainNav{display:flex;align-items:center;justify-content:flex-end;gap:8px;min-width:0}header nav#mainNav a{position:relative;display:inline-flex;align-items:center;min-height:42px;padding:9px 12px;border-radius:10px;color:var(--text);font-size:14px;white-space:nowrap;transition:color .2s ease,background-color .2s ease,transform .2s ease}header nav#mainNav a:hover{color:var(--g);background:rgba(8,127,91,.09);transform:translateY(-1px)}header nav#mainNav a.active{color:var(--g);background:rgba(8,127,91,.12)}header nav#mainNav a.active::after{content:"";position:absolute;left:12px;right:12px;bottom:4px;height:3px;border-radius:999px;background:linear-gradient(90deg,var(--g),#6366f1)}header nav#mainNav a.active:hover{color:var(--g);background:rgba(8,127,91,.16)}.dark header nav#mainNav a{color:#dbeafe}.dark header nav#mainNav a:hover,.dark header nav#mainNav a.active{color:#86efac;background:rgba(134,239,172,.12)}.dark header nav#mainNav a.active::after{background:linear-gradient(90deg,#86efac,#a5b4fc)}@media(max-width:850px){header .nav{gap:12px}header nav#mainNav{display:none;position:absolute;left:4%;right:4%;top:68px;gap:5px;padding:10px;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 14px 30px rgba(15,23,42,.12);align-items:stretch;justify-content:flex-start}header nav#mainNav.open{display:flex;flex-direction:column}header nav#mainNav a{width:100%;min-height:44px;padding:10px 13px}header nav#mainNav a.active::after{left:13px;right:auto;bottom:10px;width:4px;height:24px}.dark header nav#mainNav{background:#18212b;border-color:#334155}}@media(max-width:560px){header nav#mainNav{top:64px}header nav#mainNav a{font-size:15px}}`;
document.head.appendChild(navigationStyle);

const money = value => "৳" + Number(value || 0).toLocaleString("bn-BD");
function escapeHTML(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function getVideoUrl(product) {
  return product.video_url || (Array.isArray(product.video_urls) ? product.video_urls[0] : "");
}
function getProductImage(product) {
  return product.image_url || "assets/product-placeholder.svg";
}
function productMessage(product) {
  return encodeURIComponent(`আসসালামু আলাইকুম,\n\nআমি "${product.name}" অর্ডার করতে চাই।\nদাম: ${money(product.price)}\n\nসহজ নিত্যালয়`);
}

function render() {
  const query = search.value.toLowerCase().trim();
  const category = filter.value;
  const filtered = products.filter(product => {
    const text = `${product.name || ""} ${product.description || ""}`.toLowerCase();
    return (!query || text.includes(query)) && (!category || product.category === category);
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty"><div style="font-size:42px;margin-bottom:10px">🛍️</div><strong>কোনো পণ্য পাওয়া যায়নি</strong><p>অন্য কোনো পণ্য বা ক্যাটাগরি দিয়ে চেষ্টা করুন।</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(product => {
    const name = escapeHTML(product.name || "পণ্য");
    const description = escapeHTML(product.description || "");
    const categoryName = escapeHTML(product.category || "অন্যান্য");
    const image = getProductImage(product);
    const videoUrl = getVideoUrl(product);
    const productUrl = new URL(`#product-${product.id}`, window.location.href).href;
    const stock = Number(product.quantity ?? 0);
    return `<article class="card product-card" id="product-${escapeHTML(product.id)}">
      <div class="pic productImageWrap">
        ${videoUrl ? `<button class="videoThumb" type="button" data-video-url="${escapeHTML(videoUrl)}" aria-label="Play video for ${name}"><video src="${escapeHTML(videoUrl)}" poster="${escapeHTML(image)}" muted playsinline preload="metadata"></video><span class="videoPlay" aria-hidden="true">▶</span></button>` : `<img src="${escapeHTML(image)}" alt="${name}" loading="lazy" onerror="this.src='assets/product-placeholder.svg'">`}
        ${product.featured ? `<span class="featuredBadge">⭐ জনপ্রিয়</span>` : ""}
      </div>
      <div class="body content">
        <small class="category">${categoryName}</small>
        <h3>${name}</h3>
        ${description ? `<p class="productDescription">${description}</p>` : ""}
        <div class="stock${stock > 0 ? "" : " out"}"><span class="stockDot"></span>${stock > 0 ? `স্টকে আছে: ${stock}` : "স্টক শেষ"}</div>
        <div class="priceRow"><strong class="price">${money(product.price)}</strong>${product.old_price ? `<del>${money(product.old_price)}</del>` : ""}</div>
        <div class="productActions">
          <a class="btn primary whatsapp" href="https://wa.me/8801568853909?text=${productMessage(product)}" target="_blank" rel="noopener">🟢 WhatsApp-এ অর্ডার</a>
          <button class="btn moreBtn" type="button" data-product-id="${escapeHTML(product.id)}">More</button>
          <button class="btn shareBtn" type="button" data-name="${name}" data-url="${productUrl}">🔗 শেয়ার</button>
        </div>
      </div>
    </article>`;
  }).join("");
  attachShareButtons();
  attachVideoButtons();
  attachMoreButtons();
}

function closeVideoModal() {
  const modal = document.getElementById("videoModal");
  if (!modal) return;
  modal.querySelector("video")?.pause();
  modal.classList.remove("isOpen");
  document.body.classList.remove("videoModalOpen");
}
function openVideoModal(url) {
  closeProductDetailsModal();
  let modal = document.getElementById("videoModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "videoModal";
    modal.className = "videoModal";
    modal.innerHTML = `<div class="videoModalContent" role="dialog" aria-modal="true" aria-label="Product video"><button class="videoModalClose" type="button" aria-label="Close video">×</button><video controls playsinline></video></div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", event => {
      if (event.target === modal || event.target.closest(".videoModalClose")) closeVideoModal();
    });
  }
  const video = modal.querySelector("video");
  video.src = url;
  video.currentTime = 0;
  modal.classList.add("isOpen");
  document.body.classList.add("videoModalOpen");
  video.focus();
}
function attachVideoButtons() {
  document.querySelectorAll(".videoThumb").forEach(button => button.addEventListener("click", () => openVideoModal(button.dataset.videoUrl)));
}

function closeProductDetailsModal() {
  const modal = document.getElementById("productDetailsModal");
  if (modal) modal.remove();
  document.body.classList.remove("productDetailsOpen");
}
function openProductDetailsModal(product) {
  closeVideoModal();
  closeProductDetailsModal();
  const image = getProductImage(product);
  const videoUrl = getVideoUrl(product);
  const name = escapeHTML(product.name || "পণ্য");
  const category = escapeHTML(product.category || "অন্যান্য");
  const description = escapeHTML(product.description || "");
  const stock = Number(product.quantity ?? 0);
  const modal = document.createElement("div");
  modal.id = "productDetailsModal";
  modal.className = "productDetailsModal";
  modal.innerHTML = `<div class="productDetailsPanel" role="dialog" aria-modal="true" aria-label="Product details">
    <button class="productDetailsClose" type="button" aria-label="Close product details">×</button>
    <div class="productDetailsMedia"><img src="${escapeHTML(image)}" alt="${name}" onerror="this.src='assets/product-placeholder.svg'">${videoUrl ? `<video src="${escapeHTML(videoUrl)}" controls playsinline preload="metadata"></video>` : ""}</div>
    <div class="productDetailsBody"><small>${category}</small><h2>${name}</h2><div class="productDetailsPrice"><strong>${money(product.price)}</strong>${product.old_price ? `<del>${money(product.old_price)}</del>` : ""}</div><p class="productDetailsStock">${stock > 0 ? `স্টকে আছে: ${stock}` : "স্টক শেষ"}</p>${description ? `<p class="productDetailsDescription">${description}</p>` : ""}<a class="btn primary whatsapp" href="https://wa.me/8801568853909?text=${productMessage(product)}" target="_blank" rel="noopener">🟢 WhatsApp-এ অর্ডার</a></div>
  </div>`;
  document.body.appendChild(modal);
  modal.addEventListener("click", event => {
    if (event.target === modal || event.target.closest(".productDetailsClose")) closeProductDetailsModal();
  });
  document.body.classList.add("productDetailsOpen");
}
function attachMoreButtons() {
  document.querySelectorAll(".moreBtn").forEach(button => button.addEventListener("click", () => {
    const product = products.find(item => String(item.id) === button.dataset.productId);
    if (product) openProductDetailsModal(product);
  }));
}

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeVideoModal();
    closeProductDetailsModal();
  }
});

function attachShareButtons() {
  document.querySelectorAll(".shareBtn").forEach(button => button.addEventListener("click", async () => {
    const name = button.dataset.name;
    const url = button.dataset.url;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} | সহজ নিত্যালয়`, text: `সহজ নিত্যালয় থেকে ${name} দেখুন।`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showShareMessage("✅ পণ্যের লিংক কপি হয়েছে!");
    } catch (error) {
      if (error.name === "AbortError") return;
      try { await navigator.clipboard.writeText(url); showShareMessage("✅ পণ্যের লিংক কপি হয়েছে!"); } catch { prompt("এই লিংকটি কপি করুন:", url); }
    }
  }));
}
function showShareMessage(message) {
  let box = document.getElementById("shareMessage");
  if (!box) {
    box = document.createElement("div");
    box.id = "shareMessage";
    Object.assign(box.style, { position: "fixed", left: "50%", bottom: "25px", transform: "translateX(-50%)", zIndex: "9999", padding: "12px 20px", borderRadius: "12px", background: "#0f766e", color: "#fff", fontWeight: "700", boxShadow: "0 10px 30px rgba(0,0,0,.2)" });
    document.body.appendChild(box);
  }
  box.textContent = message;
  box.style.display = "block";
  clearTimeout(window.shareMessageTimer);
  window.shareMessageTimer = setTimeout(() => { box.style.display = "none"; }, 2500);
}

async function load() {
  if (window.SUPABASE_URL.includes("PASTE_")) { status.textContent = "config.js-এ Supabase তথ্য বসান।"; return; }
  status.textContent = "পণ্য লোড হচ্ছে...";
  status.classList.add("statusLoading");
  grid.innerHTML = `<div class="loadingState" role="status" aria-live="polite"><div><div class="loadingBag" aria-hidden="true"></div><div class="loadingLabel">পণ্য লোড হচ্ছে...</div></div></div>`;
  try {
    const { data, error } = await db.from("products").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase error:", error);
      status.classList.remove("statusLoading");
      status.textContent = "পণ্য লোড হয়নি";
      grid.innerHTML = `<div class="loadingError" role="alert">পণ্য লোড করতে সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।</div>`;
      return;
    }
    products = data || [];
    status.classList.remove("statusLoading");
    status.textContent = products.length ? `${products.length}টি পণ্য পাওয়া গেছে` : "এখনো কোনো পণ্য যোগ করা হয়নি।";
    render();
  } catch (error) {
    console.error(error);
    status.classList.remove("statusLoading");
    status.textContent = "পণ্য লোড হয়নি";
    grid.innerHTML = `<div class="loadingError" role="alert">পণ্য লোড করতে সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।</div>`;
  }
}

search?.addEventListener("input", render);
filter?.addEventListener("change", render);
document.querySelectorAll("[data-category]").forEach(item => item.addEventListener("click", () => {
  filter.value = item.dataset.category;
  document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
  render();
}));
const menuBtn = document.getElementById("menuBtn");
const mainNav = document.getElementById("mainNav");
const navLinks = mainNav ? [...mainNav.querySelectorAll('a[href^="#"]')] : [];
const sections = navLinks
  .map(link => document.getElementById(link.getAttribute("href").slice(1)))
  .filter(Boolean);

function setActiveNavigation(id) {
  navLinks.forEach(link => {
    const isActive = link.getAttribute("href") === `#${id}`;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function syncActiveNavigation() {
  const hashId = window.location.hash.replace(/^#/, "");
  if (hashId && sections.some(section => section.id === hashId)) {
    setActiveNavigation(hashId);
    return;
  }
  setActiveNavigation("home");
}

navLinks.forEach(link => link.addEventListener("click", () => {
  const id = link.getAttribute("href").slice(1);
  setActiveNavigation(id);
}));

if (sections.length && "IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActiveNavigation(visible.target.id);
  }, { rootMargin: "-24% 0px -58% 0px", threshold: [0.05, 0.2, 0.5] });
  sections.forEach(section => sectionObserver.observe(section));
}
window.addEventListener("hashchange", syncActiveNavigation);
syncActiveNavigation();

if (menuBtn && mainNav) {
  menuBtn.addEventListener("click", () => mainNav.classList.toggle("open"));
  mainNav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => mainNav.classList.remove("open")));
}
const themeToggle = document.getElementById("themeToggle");
function updateThemeIcon() { if (themeToggle) themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙"; }
if (localStorage.getItem("sohoj-theme") === "dark") document.body.classList.add("dark");
updateThemeIcon();
themeToggle?.addEventListener("click", () => { document.body.classList.toggle("dark"); localStorage.setItem("sohoj-theme", document.body.classList.contains("dark") ? "dark" : "light"); updateThemeIcon(); });
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
load();
