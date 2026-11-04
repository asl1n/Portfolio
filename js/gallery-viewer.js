/* ──────────────────────────────────────────────────────────────────
   GALLERY VIEWER
   Builds one <dialog> lazily and fills it from window.PROJECT_GALLERIES.
   Any button with  data-gallery="<key>"  opens that gallery.
   ────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  const galleries = window.PROJECT_GALLERIES || {};
  const SWIPE_PX = 50;

  let dialog,
    ui,
    slides = [],
    index = 0,
    thumbs = [];

  const el = (tag, className, attrs) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  };

  const chevron = (d) =>
    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

  /* ── Build the dialog once ── */
  function build() {
    dialog = el("dialog", "viewer", { "aria-labelledby": "viewerHeading" });
    dialog.innerHTML = `
      <div class="viewer-box">
        <header class="viewer-header">
          <h2 id="viewerHeading"></h2>
          <button class="viewer-close" type="button" aria-label="Close viewer">&times;</button>
        </header>
        <div class="viewer-stage">
          <button class="viewer-nav prev" type="button" aria-label="Previous screen">${chevron("M15 5l-7 7 7 7")}</button>
          <img class="viewer-img" alt="" draggable="false" />
          <button class="viewer-nav next" type="button" aria-label="Next screen">${chevron("M9 5l7 7-7 7")}</button>
        </div>
        <div class="viewer-info" aria-live="polite">
          <h3 class="viewer-title"></h3>
          <p class="viewer-text"></p>
        </div>
        <div class="viewer-thumbs" role="group" aria-label="Choose a screen"></div>
      </div>`;
    document.body.appendChild(dialog);

    const q = (s) => dialog.querySelector(s);
    ui = {
      heading: q("#viewerHeading"),
      stage: q(".viewer-stage"),
      img: q(".viewer-img"),
      title: q(".viewer-title"),
      text: q(".viewer-text"),
      thumbs: q(".viewer-thumbs"),
      prev: q(".viewer-nav.prev"),
      next: q(".viewer-nav.next"),
    };

    q(".viewer-close").addEventListener("click", () => dialog.close());
    ui.prev.addEventListener("click", () => step(-1));
    ui.next.addEventListener("click", () => step(1));

    /* Backdrop click (the <dialog> itself is the backdrop target) */
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () =>
      document.documentElement.classList.remove("no-scroll"),
    );
    dialog.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });

    /* Touch / pen swipe */
    let startX = null;
    ui.stage.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") startX = e.clientX;
    });
    ui.stage.addEventListener("pointerup", (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > SWIPE_PX) step(dx < 0 ? 1 : -1);
    });
    ui.stage.addEventListener("pointercancel", () => (startX = null));
  }

  /* ── Load a gallery's data into the dialog ── */
  function load(gallery) {
    slides = gallery.slides;
    ui.heading.textContent = gallery.heading || "";

    ui.thumbs.replaceChildren();
    thumbs = slides.map((slide, i) => {
      const b = el("button", "viewer-thumb", {
        type: "button",
        "aria-label": `Show ${slide.title}`,
      });
      const t = el("img", "", { alt: "", loading: "lazy", draggable: "false" });
      t.src = slide.src;
      b.appendChild(t);
      b.addEventListener("click", () => show(i));
      ui.thumbs.appendChild(b);
      return b;
    });

    const multi = slides.length > 1;
    ui.prev.hidden = ui.next.hidden = ui.thumbs.hidden = !multi;
  }

  const preload = (i) => {
    new Image().src = slides[(i + slides.length) % slides.length].src;
  };

  function show(i) {
    index = (i + slides.length) % slides.length;
    const s = slides[index];

    ui.img.classList.add("is-changing");
    ui.img.onload = ui.img.onerror = () =>
      ui.img.classList.remove("is-changing");
    ui.img.src = s.src;
    ui.img.alt = s.alt || s.title;
    ui.title.textContent = s.title;
    ui.text.textContent = s.text || "";

    thumbs.forEach((t, n) => {
      const on = n === index;
      t.classList.toggle("active", on);
      if (on) t.setAttribute("aria-current", "true");
      else t.removeAttribute("aria-current");
    });
    thumbs[index].scrollIntoView({ block: "nearest", inline: "center" });

    preload(index + 1);
    preload(index - 1);
  }

  const step = (d) => slides.length > 1 && show(index + d);

  /* ── Open from any [data-gallery] button ── */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-gallery]");
    if (!btn) return;

    const gallery = galleries[btn.dataset.gallery];
    if (!gallery || !gallery.slides || !gallery.slides.length) return;

    if (!dialog) build();
    load(gallery);
    show(0);
    dialog.showModal();
    document.documentElement.classList.add("no-scroll");
  });
})();
