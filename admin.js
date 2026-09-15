const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const loginBox = document.getElementById("loginBox");
const adminBox = document.getElementById("adminBox");
const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");
const logoutBtn = document.getElementById("logoutBtn");
const formMsg = document.getElementById("formMsg");
const list = document.getElementById("adminProducts");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const money = v =>
  "৳" + Number(v || 0).toLocaleString("bn-BD");


/* =========================
   AUTH CHECK
========================= */

async function checkAuth() {
  try {
    const { data, error } = await db.auth.getSession();

    if (error) {
      console.error(error);
      showLogin();
      return;
    }

    if (data.session) {
      showAdmin();
      loadProducts();
    } else {
      showLogin();
    }

  } catch (err) {
    console.error(err);
    showLogin();
  }
}


function showLogin() {
  loginBox.classList.remove("hidden");
  adminBox.classList.add("hidden");
}


function showAdmin() {
  loginBox.classList.add("hidden");
  adminBox.classList.remove("hidden");
}


/* =========================
   LOGIN
========================= */

loginForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  loginMsg.textContent = "লগইন হচ্ছে...";

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    loginMsg.textContent = "Email এবং Password দিন।";
    return;
  }

  try {

    const { data, error } =
      await db.auth.signInWithPassword({
        email: email,
        password: password
      });

    if (error) {
      console.error(error);

      loginMsg.textContent =
        "লগইন হয়নি: " + error.message;

      return;
    }

    if (!data.session) {
      loginMsg.textContent =
        "Login session পাওয়া যায়নি। আবার চেষ্টা করুন।";

      return;
    }

    loginMsg.textContent = "লগইন সফল হচ্ছে...";

    showAdmin();

    await loadProducts();

    loginMsg.textContent = "";

  } catch (err) {

    console.error(err);

    loginMsg.textContent =
      "Login error: " + err.message;
  }

});


/* =========================
   LOGOUT
========================= */

logoutBtn.addEventListener("click", async () => {

  await db.auth.signOut();

  showLogin();

  loginMsg.textContent = "লগআউট হয়েছে।";

});


/* =========================
   ADD PRODUCT
========================= */

document.getElementById("productForm").addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    formMsg.textContent = "ছবি আপলোড হচ্ছে...";

    const file =
      document.getElementById("pImage").files[0];

    if (!file) {
      formMsg.textContent = "ছবি নির্বাচন করুন।";
      return;
    }

    try {

      const ext =
        (file.name.split(".").pop() || "jpg")
          .toLowerCase();

      const path =
        `${crypto.randomUUID()}.${ext}`;

      const upload =
        await db.storage
          .from("product-images")
          .upload(path, file, {
            contentType: file.type
          });

      if (upload.error) {
        formMsg.textContent =
          "ছবি আপলোড হয়নি: " +
          upload.error.message;

        return;
      }

      const publicUrl =
        db.storage
          .from("product-images")
          .getPublicUrl(path)
          .data.publicUrl;

      const {
        error
      } = await db
        .from("products")
        .insert({

          name:
            document.getElementById("pName")
              .value.trim(),

          price:
            Number(
              document.getElementById("pPrice")
                .value
            ),

          old_price:
            document.getElementById("pOldPrice")
              .value
              ? Number(
                  document.getElementById("pOldPrice")
                    .value
                )
              : null,

          category:
            document.getElementById("pCategory")
              .value,

          description:
            document.getElementById("pDescription")
              .value.trim(),

          featured:
            document.getElementById("pFeatured")
              .checked,

          image_url:
            publicUrl,

          storage_path:
            path
        });

      if (error) {

        await db.storage
          .from("product-images")
          .remove([path]);

        formMsg.textContent =
          "পণ্য যোগ হয়নি: " +
          error.message;

        return;
      }

      formMsg.textContent =
        "✅ পণ্য সফলভাবে যোগ হয়েছে।";

      e.target.reset();

      await loadProducts();

    } catch (err) {

      console.error(err);

      formMsg.textContent =
        "Error: " + err.message;
    }

  }
);


/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {

  const {
    data,
    error
  } = await db
    .from("products")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {

    list.textContent =
      "পণ্য লোড হয়নি: " +
      error.message;

    return;
  }

  list.innerHTML =
    (data || [])
      .map(p => `

        <div class="adminRow">

          <img
            src="${p.image_url || "assets/product-placeholder.svg"}"
            alt=""
          >

          <div>

            <b>${p.name}</b>

            <small>
              ${money(p.price)}
              •
              ${p.category}
            </small>

          </div>

          <button
            class="delete"
            data-id="${p.id}"
            data-path="${p.storage_path || ""}"
          >
            মুছুন
          </button>

        </div>

      `)
      .join("")
    || "কোনো পণ্য নেই।";


  list
    .querySelectorAll(".delete")
    .forEach(button => {

      button.addEventListener("click", async () => {

        if (!confirm("পণ্যটি মুছবেন?")) {
          return;
        }

        const {
          error
        } = await db
          .from("products")
          .delete()
          .eq("id", button.dataset.id);

        if (error) {

          alert(error.message);

          return;
        }

        if (button.dataset.path) {

          await db.storage
            .from("product-images")
            .remove([
              button.dataset.path
            ]);
        }

        loadProducts();

      });

    });

}


/* =========================
   AUTH STATE
========================= */

db.auth.onAuthStateChange(
  (_event, session) => {

    if (session) {
      showAdmin();
    } else {
      showLogin();
    }

  }
);


/* START */

checkAuth();