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

const productForm = document.getElementById("productForm");
const formMsg = document.getElementById("formMsg");
const list = document.getElementById("adminProducts");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const formTitle = document.getElementById("formTitle");
const formSubmit = document.getElementById("formSubmit");
const cancelEdit = document.getElementById("cancelEdit");

const pName = document.getElementById("pName");
const pPrice = document.getElementById("pPrice");
const pOldPrice = document.getElementById("pOldPrice");
const pQuantity = document.getElementById("pQuantity");
const pCategory = document.getElementById("pCategory");
const pDescription = document.getElementById("pDescription");
const pImage = document.getElementById("pImage");
const pFeatured = document.getElementById("pFeatured");

const money = (value) =>
  "৳" + Number(value || 0).toLocaleString("bn-BD");

let editingProduct = null;

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================
   AUTH
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
      await loadProducts();
    } else {
      showLogin();
    }
  } catch (error) {
    console.error(error);
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

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  loginMsg.textContent = "লগইন হচ্ছে...";

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    loginMsg.textContent = "Email এবং Password দিন।";
    return;
  }

  try {
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error(error);
      loginMsg.textContent = "লগইন হয়নি: " + error.message;
      return;
    }

    if (!data.session) {
      loginMsg.textContent = "Login session পাওয়া যায়নি।";
      return;
    }

    loginMsg.textContent = "লগইন সফল হয়েছে।";

    showAdmin();
    await loadProducts();

    setTimeout(() => {
      loginMsg.textContent = "";
    }, 1500);

  } catch (error) {
    console.error(error);
    loginMsg.textContent = "Login error: " + error.message;
  }
});

logoutBtn.addEventListener("click", async () => {
  await db.auth.signOut();

  resetEditMode();
  showLogin();

  loginMsg.textContent = "লগআউট হয়েছে।";
});

/* =========================
   PRODUCT FORM
========================= */

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (editingProduct) {
    await updateProduct();
  } else {
    await addProduct();
  }
});

/* =========================
   ADD PRODUCT
========================= */

async function addProduct() {
  formMsg.textContent = "ছবি আপলোড হচ্ছে...";

  const file = pImage.files[0];

  if (!file) {
    formMsg.textContent = "ছবি নির্বাচন করুন।";
    return;
  }

  try {
    /* ---------- Upload Image ---------- */

    const ext =
      (file.name.split(".").pop() || "jpg").toLowerCase();

    const path = `${crypto.randomUUID()}.${ext}`;

    const upload = await db.storage
      .from("product-images")
      .upload(path, file, {
        contentType: file.type
      });

    if (upload.error) {
      formMsg.textContent =
        "ছবি আপলোড হয়নি: " + upload.error.message;
      return;
    }

    const publicUrl =
      db.storage
        .from("product-images")
        .getPublicUrl(path)
        .data
        .publicUrl;

    /* ---------- Save Product ---------- */

    formMsg.textContent = "Product Save হচ্ছে...";

    const productData = {
      name: pName.value.trim(),
      price: Number(pPrice.value),
      old_price: pOldPrice.value
        ? Number(pOldPrice.value)
        : null,
      quantity: Number(pQuantity.value || 0),
      category: pCategory.value,
      description: pDescription.value.trim(),
      featured: pFeatured.checked,
      image_url: publicUrl,
      storage_path: path
    };

    const { data: savedProduct, error } =
      await db
        .from("products")
        .insert(productData)
        .select()
        .single();

    if (error) {
      await db.storage
        .from("product-images")
        .remove([path]);

      formMsg.textContent =
        "পণ্য যোগ হয়নি: " + error.message;

      return;
    }

    /* ---------- Facebook Auto Post ---------- */

    formMsg.textContent =
      "✅ Product Save হয়েছে। এখন Facebook-এ Post হচ্ছে...";

    try {
      const { data: facebookResult, error: facebookError } =
        await db.functions.invoke("facebook-auto-post", {
          body: {
            name: savedProduct.name,
            price: savedProduct.price,
            old_price: savedProduct.old_price,
            quantity: savedProduct.quantity,
            category: savedProduct.category,
            description: savedProduct.description,
            image_url: savedProduct.image_url,
            product_url:
              "https://sohojnittaloy.github.io/sohojnittaloy2/"
          }
        });

      if (facebookError) {
        console.error("Facebook error:", facebookError);

        formMsg.textContent =
          "✅ Product Website-এ Save হয়েছে, কিন্তু Facebook Post হয়নি। " +
          "Error: " +
          facebookError.message;

      } else if (facebookResult?.success) {

        formMsg.textContent =
          "🎉 Product সফলভাবে Website-এ Save হয়েছে এবং Facebook-এ Automatic Post হয়েছে!";

      } else {

        formMsg.textContent =
          "✅ Product Save হয়েছে, কিন্তু Facebook Post নিশ্চিত করা যায়নি।";
      }

    } catch (facebookError) {

      console.error("Facebook function error:", facebookError);

      formMsg.textContent =
        "✅ Product Save হয়েছে, কিন্তু Facebook Auto Post-এ সমস্যা হয়েছে।";
    }

    /* ---------- Reset ---------- */

    productForm.reset();
    pQuantity.value = "0";

    await loadProducts();

  } catch (error) {

    console.error(error);

    formMsg.textContent =
      "Error: " + error.message;
  }
}

/* =========================
   EDIT PRODUCT
========================= */

function startEdit(product) {
  editingProduct = product;

  formTitle.textContent =
    "পণ্য Edit / Modify করুন";

  formSubmit.textContent =
    "💾 পরিবর্তন সংরক্ষণ করুন";

  cancelEdit.classList.remove("hidden");

  pName.value = product.name || "";
  pPrice.value = product.price ?? "";
  pOldPrice.value = product.old_price ?? "";
  pQuantity.value = product.quantity ?? 0;
  pCategory.value = product.category || "";
  pDescription.value = product.description || "";
  pFeatured.checked = !!product.featured;

  pImage.required = false;

  formMsg.textContent =
    "✏️ আপনি এখন এই পণ্যটি edit করছেন। নতুন ছবি দিলে ছবিও পরিবর্তন হবে।";

  productForm.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

/* =========================
   UPDATE PRODUCT
========================= */

async function updateProduct() {
  formMsg.textContent = "পণ্য আপডেট হচ্ছে...";

  try {

    let imageUrl =
      editingProduct.image_url || null;

    let storagePath =
      editingProduct.storage_path || null;

    const newFile = pImage.files[0];

    /* ---------- New Image ---------- */

    if (newFile) {

      formMsg.textContent =
        "নতুন ছবি আপলোড হচ্ছে...";

      const ext =
        (newFile.name.split(".").pop() || "jpg").toLowerCase();

      const newPath =
        `${crypto.randomUUID()}.${ext}`;

      const upload = await db.storage
        .from("product-images")
        .upload(newPath, newFile, {
          contentType: newFile.type
        });

      if (upload.error) {

        formMsg.textContent =
          "নতুন ছবি আপলোড হয়নি: " +
          upload.error.message;

        return;
      }

      imageUrl =
        db.storage
          .from("product-images")
          .getPublicUrl(newPath)
          .data
          .publicUrl;

      storagePath = newPath;

      if (editingProduct.storage_path) {

        await db.storage
          .from("product-images")
          .remove([
            editingProduct.storage_path
          ]);
      }
    }

    /* ---------- Update Database ---------- */

    const { error } =
      await db
        .from("products")
        .update({
          name: pName.value.trim(),
          price: Number(pPrice.value),
          old_price: pOldPrice.value
            ? Number(pOldPrice.value)
            : null,
          quantity: Number(pQuantity.value || 0),
          category: pCategory.value,
          description: pDescription.value.trim(),
          featured: pFeatured.checked,
          image_url: imageUrl,
          storage_path: storagePath
        })
        .eq("id", editingProduct.id);

    if (error) {

      formMsg.textContent =
        "পণ্য আপডেট হয়নি: " +
        error.message;

      return;
    }

    formMsg.textContent =
      "✅ পণ্য সফলভাবে Update হয়েছে।";

    resetEditMode();

    await loadProducts();

  } catch (error) {

    console.error(error);

    formMsg.textContent =
      "Update error: " + error.message;
  }
}

/* =========================
   CANCEL EDIT
========================= */

cancelEdit.addEventListener("click", () => {
  resetEditMode();
});

function resetEditMode() {

  editingProduct = null;

  formTitle.textContent =
    "Add Product";

  formSubmit.textContent =
    "Add Product";

  cancelEdit.classList.add("hidden");

  productForm.reset();

  pQuantity.value = "0";

  pImage.required = true;

  formMsg.textContent = "";
}

/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {

  list.innerHTML =
    "পণ্য লোড হচ্ছে...";

  const { data, error } =
    await db
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
      .map(product => `

        <div class="adminRow">

          <img
            src="${product.image_url || "assets/product-placeholder.svg"}"
            alt=""
          >

          <div>

            <b>
              ${escapeHTML(product.name)}
            </b>

            <small>
              ${money(product.price)}
              •
              ${escapeHTML(product.category || "")}
              •
              Stock:
              ${Number(product.quantity || 0)}
            </small>

          </div>

          <div
            class="adminActions"
            style="
              display:flex;
              gap:8px;
              align-items:center;
              margin-left:auto;
            "
          >

            <button
              type="button"
              class="edit"
              data-id="${product.id}"
            >
              ✏️ Edit
            </button>

            <button
              type="button"
              class="delete"
              data-id="${product.id}"
              data-path="${product.storage_path || ""}"
            >
              মুছুন
            </button>

          </div>

        </div>

      `)
      .join("")
      ||
      "কোনো পণ্য নেই।";

  /* ---------- Edit Buttons ---------- */

  list
    .querySelectorAll(".edit")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const product =
            data.find(
              item =>
                String(item.id) ===
                String(button.dataset.id)
            );

          if (product) {
            startEdit(product);
          }

        }
      );

    });

  /* ---------- Delete Buttons ---------- */

  list
    .querySelectorAll(".delete")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          if (
            !confirm(
              "এই পণ্যটি মুছে ফেলবেন?"
            )
          ) {
            return;
          }

          button.disabled = true;
          button.textContent = "মুছছে...";

          const { error } =
            await db
              .from("products")
              .delete()
              .eq(
                "id",
                button.dataset.id
              );

          if (error) {

            alert(
              "Delete failed: " +
              error.message
            );

            button.disabled = false;
            button.textContent = "মুছুন";

            return;
          }

          if (button.dataset.path) {

            await db.storage
              .from("product-images")
              .remove([
                button.dataset.path
              ]);
          }

          await loadProducts();

        }
      );

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

/* =========================
   START
========================= */

checkAuth();