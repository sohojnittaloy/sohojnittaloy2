const client = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
const loginBox=document.getElementById("loginBox"), dashboard=document.getElementById("dashboard");
const loginMsg=document.getElementById("loginMsg"), productMsg=document.getElementById("productMsg"), adminProducts=document.getElementById("adminProducts");

function money(v){return `৳${Number(v||0).toLocaleString("bn-BD")}`}
function esc(s=""){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function showMsg(el,msg,bad=false){el.textContent=msg;el.className="form-msg "+(bad?"bad":"ok")}

async function ensureAdminRecord(){
  const {data:{session}}=await client.auth.getSession();
  if(!session) return false;

  const {error}=await client.from("admin_users").upsert({user_id:session.user.id},{onConflict:"user_id"});
  if(error){
    console.warn("Admin registration failed:", error.message);
    showMsg(productMsg, "To set up admin approval, add the admin_users policies in Supabase SQL.", true);
    return false;
  }

  return true;
}

async function checkSession(){
  const {data:{session}}=await client.auth.getSession();
  if(session){
    loginBox.classList.add("hidden");
    dashboard.classList.remove("hidden");
    const adminReady = await ensureAdminRecord();
    if(adminReady) loadAdminProducts();
  }
}
document.getElementById("loginForm").addEventListener("submit",async e=>{
  e.preventDefault(); showMsg(loginMsg,"Signing in...");
  const {error}=await client.auth.signInWithPassword({email:email.value,password:password.value});
  if(error) showMsg(loginMsg,error.message,true); else checkSession();
});
document.getElementById("logout").addEventListener("click",async()=>{await client.auth.signOut();location.reload()});
document.getElementById("refresh").addEventListener("click",loadAdminProducts);

document.getElementById("productForm").addEventListener("submit",async e=>{
  e.preventDefault(); showMsg(productMsg,"Uploading product...");
  const file=pImage.files[0]; if(!file){showMsg(productMsg,"Please select an image.",true);return;}
  const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"-"); const path=`${Date.now()}-${safeName}`;
  const up=await client.storage.from("product-images").upload(path,file,{upsert:false});
  if(up.error){showMsg(productMsg,up.error.message,true);return}
  const {data:urlData}=client.storage.from("product-images").getPublicUrl(path);
  const {error}=await client.from("products").insert({name:pName.value,price:Number(pPrice.value),old_price:pOldPrice.value?Number(pOldPrice.value):null,category:pCategory.value,description:pDescription.value,image_url:urlData.publicUrl,featured:pFeatured.checked,storage_path:path});
  if(error){await client.storage.from("product-images").remove([path]);showMsg(productMsg,error.message,true);return}
  e.target.reset(); showMsg(productMsg,"Product added successfully."); loadAdminProducts();
});

async function loadAdminProducts(){
  const {data,error}=await client.from("products").select("*").order("created_at",{ascending:false});
  if(error){adminProducts.innerHTML=`<p class="form-msg bad">${esc(error.message)}</p>`;return}
  adminProducts.innerHTML=(data||[]).map(p=>`<div class="admin-product"><img src="${p.image_url}" alt=""><div><b>${esc(p.name)}</b><p>${money(p.price)} · ${esc(p.category)}</p></div><button class="delete-btn" onclick="deleteProduct('${p.id}','${p.storage_path||""}')">Delete</button></div>`).join("") || "<p>No products yet.</p>";
}
async function deleteProduct(id,path){
  if(!confirm("Do you want to delete this product?")) return;
  if(path) await client.storage.from("product-images").remove([path]);
  const {error}=await client.from("products").delete().eq("id",id);
  if(error) alert(error.message); else loadAdminProducts();
}
checkSession();
