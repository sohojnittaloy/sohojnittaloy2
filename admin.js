const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

/* =========================
   ELEMENTS
========================= */

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
const pVideo = document.getElementById("pVideo");
const pFeatured = document.getElementById("pFeatured");

const money = (value) =>
  "৳" + Number(value || 0).toLocaleString("bn-BD");

let editingProduct = null;


/* =========================
   HELPER
========================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function redactFacebookSecrets(value) {
  return String(value ?? "")
    .replace(/("?(?:access_token|accessToken|auth_token|authorization|token|secret|api_key|apiKey)"?\s*:\s*)"[^"]*"/gi, '$1"[REDACTED]"')
    .replace(/(Bearer\s+)[^\s,}"']+/gi, "$1[REDACTED]")
    .replace(/([?&](?:access_token|accessToken|token|secret|api_key|apiKey)=)[^&\s]+/gi, "$1[REDACTED]");
}


async function getFacebookErrorDetails(facebookError) {
  const message = redactFacebookSecrets(facebookError?.message || "Unknown Facebook function error");
  const status = facebookError?.status ?? facebookError?.context?.status ?? "";
  let details = redactFacebookSecrets(facebookError?.details || "");
  const context = facebookError?.context;

  if (context && typeof context.text === "function") {
    try {
      const responseText = await context.text();

      if (responseText) {
        try {
          details = JSON.stringify(JSON.parse(responseText), null, 2);
        } catch {
          details = responseText;
        }

        details = redactFacebookSecrets(details);
      }
    } catch {
      details = details || "Could not read the Facebook function response body.";
    }
  }

  return { message, status, details };
}


/* =========================
   HIDE BROKEN CURRENT IMAGE
========================= */

document.querySelectorAll('img[alt="Current product image"]').forEach(img => {
  img.style.display = "none";

  img.addEventListener("error", () => {
    img.style.display = "none";
  });
});


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


/* =========================
   LOGIN
========================= */

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

    const { data, error } =
      await db.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      loginMsg.textContent =
        "লগইন হয়নি: " + error.message;
      return;
    }

    if (!data.session) {
      loginMsg.textContent =
        "Login session পাওয়া যায়নি।";
      return;
    }

    showAdmin();
    await loadProducts();

    loginMsg.textContent =
      "লগইন সফল হয়েছে।";

    setTimeout(() => {
      loginMsg.textContent = "";
    }, 1500);

  } catch (error) {

    console.error(error);

    loginMsg.textContent =
      "Login error: " + error.message;
  }
});


/* =========================
   LOGOUT
========================= */

logoutBtn.addEventListener("click", async () => {

  await db.auth.signOut();

  resetEditMode();
  showLogin();

  loginMsg.textContent =
    "লগআউট হয়েছে।";
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
   UPLOAD IMAGE
========================= */

async function uploadImage(file) {

  if (!file) return null;

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
    throw new Error(
      "ছবি আপলোড হয়নি: " +
      upload.error.message
    );
  }

  const publicUrl =
    db.storage
      .from("product-images")
      .getPublicUrl(path)
      .data
      .publicUrl;

  return {
    url: publicUrl,
    path: path
  };
}


/* =========================
   UPLOAD VIDEO
========================= */

async function uploadVideo(file) {

  if (!file) return null;

  const ext =
    (file.name.split(".").pop() || "mp4")
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
    throw new Error(
      "ভিডিও আপলোড হয়নি: " +
      upload.error.message
    );
  }

  const publicUrl =
    db.storage
      .from("product-images")
      .getPublicUrl(path)
      .data
      .publicUrl;

  return {
    url: publicUrl,
    path: path
  };
}


/* =========================
   ADD PRODUCT
========================= */

async function addProduct() {

  const imageFile =
    pImage?.files?.[0] || null;

  const videoFile =
    pVideo?.files?.[0] || null;

  /* Image OR Video required */

  if (!imageFile && !videoFile) {

    formMsg.textContent =
      "🖼️ অথবা 🎥 অন্তত একটি Image বা Video নির্বাচন করুন।";

    return;
  }

  try {

    let uploadedImage = null;
    let uploadedVideo = null;

    /* IMAGE */

    if (imageFile) {

      formMsg.textContent =
        "🖼️ ছবি আপলোড হচ্ছে...";

      uploadedImage =
        await uploadImage(imageFile);
    }

    /* VIDEO */

    if (videoFile) {

      formMsg.textContent =
        "🎥 ভিডিও আপলোড হচ্ছে...";

      uploadedVideo =
        await uploadVideo(videoFile);
    }

    /* PRODUCT DATA */

    formMsg.textContent =
      "Product Save হচ্ছে...";

    const productData = {

      name:
        pName.value.trim(),

      price:
        Number(pPrice.value),

      old_price:
        pOldPrice.value
          ? Number(pOldPrice.value)
          : null,

      quantity:
        Number(pQuantity.value || 0),

      category:
        pCategory.value,

      description:
        pDescription.value.trim(),

      featured:
        pFeatured.checked,

      image_url:
        uploadedImage?.url || null,

      storage_path:
        uploadedImage?.path || null,

      video_url:
        uploadedVideo?.url || null,

      video_storage_path:
        uploadedVideo?.path || null
    };


    /* SAVE DATABASE */

    const {
      data: savedProduct,
      error
    } =
      await db
        .from("products")
        .insert(productData)
        .select()
        .single();


    if (error) {

      /* Cleanup image */

      if (uploadedImage?.path) {
        await db.storage
          .from("product-images")
          .remove([
            uploadedImage.path
          ]);
      }

      /* Cleanup video */

      if (uploadedVideo?.path) {
        await db.storage
          .from("product-images")
          .remove([
            uploadedVideo.path
          ]);
      }

      formMsg.textContent =
        "পণ্য যোগ হয়নি: " +
        error.message;

      return;
    }


    /* =========================
       FACEBOOK AUTO POST
    ========================= */

    formMsg.textContent =
      "✅ Product Save হয়েছে। Facebook-এ Post হচ্ছে...";


    try {

      const {
        data: facebookResult,
        error: facebookError
      } =
        await db.functions.invoke(
          "facebook-auto-post",
          {
            body: {

              name:
                savedProduct.name,

              price:
                savedProduct.price,

              old_price:
                savedProduct.old_price,

              quantity:
                savedProduct.quantity,

              category:
                savedProduct.category,

              description:
                savedProduct.description,

              image_url:
                savedProduct.image_url,

              video_url:
                savedProduct.video_url,

              product_url:
                "https://sohojnittaloy.github.io/sohojnittaloy2/"
            }
          }
        );


      if (facebookError) {

        const facebookDiagnostic =
          await getFacebookErrorDetails(facebookError);

        console.error("Facebook error:", {
          name: facebookError?.name || "FacebookFunctionError",
          message: facebookDiagnostic.message,
          status: facebookDiagnostic.status,
          details: facebookDiagnostic.details
        });

        formMsg.style.whiteSpace = "pre-wrap";
        formMsg.textContent =
          "⚠️ Facebook Auto Post ব্যর্থ হয়েছে\n\n" +
          "Error:\n" + facebookDiagnostic.message + "\n\n" +
          "Status:\n" + (facebookDiagnostic.status || "Unavailable") + "\n\n" +
          "Details:\n" + (facebookDiagnostic.details || "No response details available.");

      } else if (
        facebookResult?.success
      ) {

        formMsg.textContent =
          "🎉 Product Website-এ Save হয়েছে এবং Facebook Auto Post হয়েছে!";

      } else {

        formMsg.textContent =
          "✅ Product Save হয়েছে, কিন্তু Facebook Post নিশ্চিত করা যায়নি।";
      }

    } catch (facebookError) {

      const facebookDiagnostic =
        await getFacebookErrorDetails(facebookError);

      console.error("Facebook function error:", {
        name: facebookError?.name || "FacebookFunctionError",
        message: facebookDiagnostic.message,
        status: facebookDiagnostic.status,
        details: facebookDiagnostic.details
      });

      formMsg.style.whiteSpace = "pre-wrap";
      formMsg.textContent =
        "⚠️ Facebook Auto Post ব্যর্থ হয়েছে\n\n" +
        "Error:\n" + facebookDiagnostic.message + "\n\n" +
        "Status:\n" + (facebookDiagnostic.status || "Unavailable") + "\n\n" +
        "Details:\n" + (facebookDiagnostic.details || "No response details available.");
    }


    /* RESET */

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

  cancelEdit.classList.remove(
    "hidden"
  );

  pName.value =
    product.name || "";

  pPrice.value =
    product.price ?? "";

  pOldPrice.value =
    product.old_price ?? "";

  pQuantity.value =
    product.quantity ?? 0;

  pCategory.value =
    product.category || "";

  pDescription.value =
    product.description || "";

  pFeatured.checked =
    !!product.featured;

  pImage.required = false;

  if (pVideo) {
    pVideo.required = false;
  }

  formMsg.textContent =
    "✏️ আপনি এখন এই পণ্যটি edit করছেন। নতুন ছবি/ভিডিও দিলে সেটিও পরিবর্তন হবে।";

  productForm.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/* =========================
   UPDATE PRODUCT
========================= */

async function updateProduct() {

  formMsg.textContent =
    "পণ্য আপডেট হচ্ছে...";

  try {

    let imageUrl =
      editingProduct.image_url ||
      null;

    let storagePath =
      editingProduct.storage_path ||
      null;

    let videoUrl =
      editingProduct.video_url ||
      null;

    let videoStoragePath =
      editingProduct.video_storage_path ||
      null;


    const newImage =
      pImage?.files?.[0] || null;

    const newVideo =
      pVideo?.files?.[0] || null;


    /* NEW IMAGE */

    if (newImage) {

      formMsg.textContent =
        "🖼️ নতুন ছবি আপলোড হচ্ছে...";

      const uploaded =
        await uploadImage(newImage);

      imageUrl =
        uploaded.url;

      storagePath =
        uploaded.path;

      if (
        editingProduct.storage_path
      ) {

        await db.storage
          .from("product-images")
          .remove([
            editingProduct.storage_path
          ]);
      }
    }


    /* NEW VIDEO */

    if (newVideo) {

      formMsg.textContent =
        "🎥 নতুন ভিডিও আপলোড হচ্ছে...";

      const uploaded =
        await uploadVideo(newVideo);

      videoUrl =
        uploaded.url;

      videoStoragePath =
        uploaded.path;

      if (
        editingProduct.video_storage_path
      ) {

        await db.storage
          .from("product-images")
          .remove([
            editingProduct.video_storage_path
          ]);
      }
    }


    /* UPDATE DATABASE */

    const { error } =
      await db
        .from("products")
        .update({

          name:
            pName.value.trim(),

          price:
            Number(pPrice.value),

          old_price:
            pOldPrice.value
              ? Number(pOldPrice.value)
              : null,

          quantity:
            Number(pQuantity.value || 0),

          category:
            pCategory.value,

          description:
            pDescription.value.trim(),

          featured:
            pFeatured.checked,

          image_url:
            imageUrl,

          storage_path:
            storagePath,

          video_url:
            videoUrl,

          video_storage_path:
            videoStoragePath

        })
        .eq(
          "id",
          editingProduct.id
        );


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
      "Update error: " +
      error.message;
  }
}


/* =========================
   CANCEL EDIT
========================= */

cancelEdit.addEventListener(
  "click",
  () => {
    resetEditMode();
  }
);


function resetEditMode() {

  editingProduct = null;

  formTitle.textContent =
    "Add Product";

  formSubmit.textContent =
    "Add Product";

  cancelEdit.classList.add(
    "hidden"
  );

  productForm.reset();

  pQuantity.value = "0";

  pImage.required = false;

  if (pVideo) {
    pVideo.required = false;
  }

  formMsg.textContent = "";
}


/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {

  list.innerHTML =
    "পণ্য লোড হচ্ছে...";

  const {
    data,
    error
  } =
    await db
      .from("products")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


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

          <div>

            ${
              product.image_url
                ? `
                  <img
                    src="${escapeHTML(product.image_url)}"
                    alt=""
                    style="
                      width:80px;
                      height:80px;
                      object-fit:cover;
                      border-radius:10px;
                    "
                  >
                `
                : ""
            }

            ${
              product.video_url
                ? `
                  <video
                    src="${escapeHTML(product.video_url)}"
                    controls
                    preload="metadata"
                    style="
                      width:80px;
                      height:80px;
                      object-fit:cover;
                      border-radius:10px;
                      margin-left:6px;
                    "
                  ></video>
                `
                : ""
            }

          </div>

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
              data-video-path="${product.video_storage_path || ""}"
            >
              মুছুন
            </button>

          </div>

        </div>

      `)
      .join("")
      ||
      "কোনো পণ্য নেই।";


  /* =========================
     EDIT BUTTON
  ========================= */

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


  /* =========================
     DELETE BUTTON
  ========================= */

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

          button.textContent =
            "মুছছে...";


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

            button.textContent =
              "মুছুন";

            return;
          }


          /* DELETE IMAGE */

          if (
            button.dataset.path
          ) {

            await db.storage
              .from("product-images")
              .remove([
                button.dataset.path
              ]);
          }


          /* DELETE VIDEO */

          if (
            button.dataset.videoPath
          ) {

            await db.storage
              .from("product-images")
              .remove([
                button.dataset.videoPath
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


/* =========================git add admin.js
   START
========================= */

checkAuth();