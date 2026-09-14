const client = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
const productsEl = document.getElementById("products");
const statusEl = document.getElementById("status");
const searchEl = document.getElementById("search");
const categoryEl = document.getElementById("categoryFilter");

document.getElementById("year").textContent = new Date().getFullYear();

function money(v){ return `৳${Number(v || 0).toLocaleString("bn-BD")}`; }
function waLink(p){
  const text = `আসসালামু আলাইকুম। আমি "${p.name}" পণ্যটি নিতে চাই। দাম: ${money(p.price)}।`;
  return `https://wa.me/8801568853909?text=${encodeURIComponent(text)}`;
}
function card(p){
  const img = p.image_url || "assets/product-placeholder.svg";
  return `<article class="product-card">
    <div class="product-image"><img src="${img}" alt="${escapeHtml(p.name)}" loading="lazy"></div>
    <div class="product-info"><small>${labelCat(p.category)}</small><h3>${escapeHtml(p.name)}</h3>
    <div class="price">${money(p.price)} ${p.old_price ? `<del>${money(p.old_price)}</del>` : ""}</div>
    ${p.description ? `<p>${escapeHtml(p.description)}</p>` : ""}
    <a class="btn primary full" href="${waLink(p)}" target="_blank">WhatsApp-এ অর্ডার</a></div>
  </article>`;
}
function labelCat(c){ return ({grocery:"মুদি পণ্য", household:"গৃহস্থালি", new:"নতুন পণ্য"})[c] || "পণ্য"; }
function escapeHtml(s=""){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

async function loadProducts(){
  statusEl.textContent = "পণ্য লোড হচ্ছে...";
  let q = client.from("products").select("*").order("created_at",{ascending:false});
  const {data,error}=await q;
  if(error){ statusEl.textContent="পণ্য লোড করা যায়নি। config.js ও Supabase সেটআপ পরীক্ষা করুন।"; console.error(error); return; }
  const search=(searchEl.value||"").toLowerCase().trim();
  const cat=categoryEl.value;
  const filtered=(data||[]).filter(p=>(!search || `${p.name} ${p.description||""}`.toLowerCase().includes(search)) && (cat==="all" || p.category===cat));
  statusEl.textContent = `${filtered.length}টি পণ্য`;
  productsEl.innerHTML = filtered.length ? filtered.map(card).join("") : `<div class="empty">এখনও কোনো পণ্য যোগ করা হয়নি।</div>`;
}
searchEl.addEventListener("input",loadProducts); categoryEl.addEventListener("change",loadProducts);
document.querySelectorAll(".category-card").forEach(b=>b.addEventListener("click",()=>{categoryEl.value=b.dataset.cat; document.getElementById("shop").scrollIntoView({behavior:"smooth"}); loadProducts();}));
document.querySelector(".menu-btn")?.addEventListener("click",()=>document.querySelector("nav").classList.toggle("open"));
loadProducts();
