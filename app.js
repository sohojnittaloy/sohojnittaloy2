/* =========================================================
   SOHOJ NITTALOY — STOREFRONT APP
   ========================================================= */

const { createClient } = supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const grid = document.getElementById("productGrid");
const status = document.getElementById("status");
const search = document.getElementById("searchInput");
const filter = document.getElementById("categoryFilter");

let products = [];


/* =========================================================
   HELPERS
   ========================================================= */

const money = (value) =>
  "৳" + Number(value || 0).toLocaleString("bn-BD");


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   RENDER PRODUCTS
   ========================================================= */

function render() {

  const q =
    search.value
      .toLowerCase()
      .trim();

  const category =
    filter.value;


  const filtered =
    products.filter((p) => {

      const text =
        `${p.name || ""} ${p.description || ""}`
          .toLowerCase();

      return (
        (!q || text.includes(q)) &&
        (!category || p.category === category)
      );

    });


  if (!filtered.length) {

    grid.innerHTML = `
      <div class="empty">
        <div style="font-size:42px;margin-bottom:10px">🛍️</div>
        <strong>কোনো পণ্য পাওয়া যায়নি</strong>
        <p>অন্য কোনো পণ্য বা ক্যাটাগরি দিয়ে চেষ্টা করুন।</p>
      </div>
    `;

    return;

  }


  grid.innerHTML =
    filtered.map((p) => {

      const name =
        escapeHTML(p.name || "পণ্য");

      const description =
        escapeHTML(p.description || "");

      const categoryName =
        escapeHTML(
          p.category || "অন্যান্য"
        );

      const image =
        p.image_url ||
        "assets/product-placeholder.svg";


      const productUrl =
        new URL(
          `#product-${p.id}`,
          window.location.href
        ).href;


      const whatsappMessage =
        encodeURIComponent(
          `আসসালামু আলাইকুম,\n\nআমি "${p.name}" অর্ডার করতে চাই।\nদাম: ${money(p.price)}\n\nসহজ নিত্যালয়`
        );


      const stock =
        Number(p.quantity ?? 0);


      const stockHTML =
        stock > 0
          ? `
            <div class="stock">
              <span class="stockDot"></span>
              স্টকে আছে: ${stock}
            </div>
          `
          : `
            <div class="stock out">
              <span class="stockDot"></span>
              স্টক শেষ
            </div>
          `;


      return `

        <article
          class="card product-card"
          id="product-${p.id}"
        >

          <div class="pic productImageWrap">

            <img
              src="${image}"
              alt="${name}"
              loading="lazy"
              onerror="this.src='assets/product-placeholder.svg'"
            >

            ${
              p.featured
                ? `
                  <span class="featuredBadge">
                    ⭐ জনপ্রিয়
                  </span>
                `
                : ""
            }

          </div>


          <div class="body content">

            <small class="category">
              ${categoryName}
            </small>


            <h3>
              ${name}
            </h3>


            ${
              description
                ? `
                  <p class="productDescription">
                    ${description}
                  </p>
                `
                : ""
            }


            ${stockHTML}


            <div class="priceRow">

              <strong class="price">
                ${money(p.price)}
              </strong>

              ${
                p.old_price
                  ? `
                    <del>
                      ${money(p.old_price)}
                    </del>
                  `
                  : ""
              }

            </div>


            <div class="productActions">

              <a
                class="btn primary whatsapp"
                href="https://wa.me/8801568853909?text=${whatsappMessage}"
                target="_blank"
                rel="noopener"
              >
                🟢 WhatsApp-এ অর্ডার
              </a>


              <button
                class="btn shareBtn"
                type="button"
                data-name="${name}"
                data-url="${productUrl}"
              >
                🔗 শেয়ার
              </button>

            </div>

          </div>

        </article>

      `;

    }).join("");


  attachShareButtons();

}


/* =========================================================
   SHARE BUTTON
   ========================================================= */

function attachShareButtons() {

  document
    .querySelectorAll(".shareBtn")
    .forEach((button) => {

      button.addEventListener(
        "click",
        async () => {

          const name =
            button.dataset.name;

          const url =
            button.dataset.url;


          try {

            if (
              navigator.share
            ) {

              await navigator.share({

                title:
                  `${name} | সহজ নিত্যালয়`,

                text:
                  `সহজ নিত্যালয় থেকে ${name} দেখুন।`,

                url:
                  url

              });

              return;
            }


            await navigator.clipboard.writeText(url);

            showShareMessage(
              "✅ পণ্যের লিংক কপি হয়েছে!"
            );


          } catch (error) {

            if (
              error.name ===
              "AbortError"
            ) {

              return;

            }


            try {

              await navigator.clipboard.writeText(url);

              showShareMessage(
                "✅ পণ্যের লিংক কপি হয়েছে!"
              );

            } catch {

              prompt(
                "এই লিংকটি কপি করুন:",
                url
              );

            }

          }

        }
      );

    });

}


/* =========================================================
   SHARE MESSAGE
   ========================================================= */

function showShareMessage(message) {

  let box =
    document.getElementById(
      "shareMessage"
    );


  if (!box) {

    box =
      document.createElement("div");

    box.id =
      "shareMessage";

    box.style.position =
      "fixed";

    box.style.left =
      "50%";

    box.style.bottom =
      "25px";

    box.style.transform =
      "translateX(-50%)";

    box.style.zIndex =
      "9999";

    box.style.padding =
      "12px 20px";

    box.style.borderRadius =
      "12px";

    box.style.background =
      "#0f766e";

    box.style.color =
      "#fff";

    box.style.fontWeight =
      "700";

    box.style.boxShadow =
      "0 10px 30px rgba(0,0,0,.2)";

    document.body.appendChild(box);

  }


  box.textContent =
    message;

  box.style.display =
    "block";


  clearTimeout(
    window.shareMessageTimer
  );


  window.shareMessageTimer =
    setTimeout(() => {

      box.style.display =
        "none";

    }, 2500);

}


/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

async function load() {

  if (
    window.SUPABASE_URL.includes(
      "PASTE_"
    )
  ) {

    status.textContent =
      "config.js-এ Supabase তথ্য বসান।";

    return;

  }


  status.textContent =
    "পণ্য লোড হচ্ছে...";


  try {

    const {
      data,
      error
    } = await db
      .from("products")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


    if (error) {

      console.error(
        "Supabase error:",
        error
      );

      status.textContent =
        "পণ্য লোড হয়নি: " +
        error.message;

      return;

    }


    products =
      data || [];


    status.textContent =
      products.length
        ? `${products.length}টি পণ্য পাওয়া গেছে`
        : "এখনো কোনো পণ্য যোগ করা হয়নি।";


    render();


  } catch (error) {

    console.error(error);

    status.textContent =
      "পণ্য লোড করতে সমস্যা হয়েছে।";

  }

}


/* =========================================================
   SEARCH
   ========================================================= */

if (search) {

  search.addEventListener(
    "input",
    render
  );

}


/* =========================================================
   CATEGORY FILTER
   ========================================================= */

if (filter) {

  filter.addEventListener(
    "change",
    render
  );

}


/* =========================================================
   CATEGORY CARDS
   ========================================================= */

document
  .querySelectorAll(
    "[data-category]"
  )
  .forEach((item) => {

    item.addEventListener(
      "click",
      () => {

        filter.value =
          item.dataset.category;


        document
          .getElementById("shop")
          .scrollIntoView({
            behavior: "smooth"
          });


        render();

      }
    );

  });


/* =========================================================
   MOBILE MENU
   ========================================================= */

const menuBtn =
  document.getElementById(
    "menuBtn"
  );

const mainNav =
  document.getElementById(
    "mainNav"
  );


if (menuBtn && mainNav) {

  menuBtn.addEventListener(
    "click",
    () => {

      mainNav.classList.toggle(
        "open"
      );

    }
  );


  mainNav
    .querySelectorAll("a")
    .forEach((link) => {

      link.addEventListener(
        "click",
        () => {

          mainNav.classList.remove(
            "open"
          );

        }
      );

    });

}


/* =========================================================
   DARK MODE
   ========================================================= */

const themeToggle =
  document.getElementById(
    "themeToggle"
  );


function updateThemeIcon() {

  if (!themeToggle) {
    return;
  }


  const dark =
    document.body.classList.contains(
      "dark"
    );


  themeToggle.textContent =
    dark ? "☀️" : "🌙";

}


const savedTheme =
  localStorage.getItem(
    "sohoj-theme"
  );


if (
  savedTheme === "dark"
) {

  document.body.classList.add(
    "dark"
  );

}


updateThemeIcon();


if (themeToggle) {

  themeToggle.addEventListener(
    "click",
    () => {

      document.body.classList.toggle(
        "dark"
      );


      const dark =
        document.body.classList.contains(
          "dark"
        );


      localStorage.setItem(
        "sohoj-theme",
        dark
          ? "dark"
          : "light"
      );


      updateThemeIcon();

    }
  );

}


/* =========================================================
   YEAR
   ========================================================= */

const year =
  document.getElementById(
    "year"
  );


if (year) {

  year.textContent =
    new Date().getFullYear();

}


/* =========================================================
   START
   ========================================================= */

load();