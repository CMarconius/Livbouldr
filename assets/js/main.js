/* ==========================================================================
   Livbouldr — tracking + form handling (PARODY SITE)
   --------------------------------------------------------------------------
   Everything routes through the dataLayer so GTM can own the tags/triggers.
   Forms POST to a single Make.com webhook, which fans out to Brevo (contacts +
   automation) and a Google Sheet. Replace the placeholder below with your real webhook.
   ========================================================================== */

// ---- CONFIG: replace before going live ------------------------------------
const LIVBOULDR_CONFIG = {
  // Paste your Make.com custom-webhook URL here:
  MAKE_WEBHOOK_URL: "https://hook.eu1.make.com/o96gh76bw5nrgxhphb2ktk565zkostyw",
};

// ---- dataLayer helper ------------------------------------------------------
window.dataLayer = window.dataLayer || [];
function dlPush(event, params) {
  window.dataLayer.push(Object.assign({ event: event }, params || {}));
}

document.addEventListener("DOMContentLoaded", function () {
  initForms();
  initClickTracking();
  initScrollDepth();
});

// ---- Forms -----------------------------------------------------------------
function initForms() {
  const forms = document.querySelectorAll("form[data-lead-form]");
  forms.forEach(function (form) {
    const formName = form.getAttribute("data-form-name") || "lead_form";
    let started = false;

    // Fire form_start once, on first field interaction.
    form.addEventListener(
      "focusin",
      function () {
        if (!started) {
          started = true;
          dlPush("form_start", { form_name: formName });
        }
      },
      { once: false }
    );

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const statusEl = form.querySelector(".form-status");
      const submitBtn = form.querySelector("[type=submit]");
      const data = Object.fromEntries(new FormData(form).entries());

      // Enrich the payload with context so Make/GA4 can segment.
      data.form_name = formName;
      data.page_path = window.location.pathname;
      data.page_title = document.title;
      data.submitted_at = new Date().toISOString();

      if (submitBtn) { submitBtn.disabled = true; }
      if (statusEl) { statusEl.textContent = "Sending..."; statusEl.className = "form-status"; }

      fetch(LIVBOULDR_CONFIG.MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then(function (res) {
          if (!res.ok) { throw new Error("Bad response " + res.status); }
          dlPush("form_submit", { form_name: formName, form_destination: "make_webhook" });
          if (statusEl) {
            statusEl.textContent = "You're in. Chalk up. (This is a parody, so nothing real happens.)";
            statusEl.className = "form-status success";
          }
          form.reset();
          started = false;
        })
        .catch(function (err) {
          // Still record the attempt so you can see it in GA4.
          dlPush("form_submit_error", { form_name: formName, error: String(err) });
          if (statusEl) {
            statusEl.textContent = "Hmm, that didn't send. Check the Make webhook URL in main.js.";
            statusEl.className = "form-status error";
          }
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; }
        });
    });
  });
}

// ---- Click tracking (CTAs + outbound links) --------------------------------
function initClickTracking() {
  document.addEventListener("click", function (e) {
    const link = e.target.closest("a");
    if (!link) { return; }

    // Explicit CTA tracking via data-cta attribute.
    const cta = link.getAttribute("data-cta");
    if (cta) {
      dlPush("cta_click", { cta_name: cta, link_url: link.href });
    }

    // Outbound-link tracking.
    if (link.hostname && link.hostname !== window.location.hostname) {
      dlPush("outbound_click", { link_url: link.href, link_domain: link.hostname });
    }
  });
}

// ---- Scroll depth (25 / 50 / 75 / 100) -------------------------------------
function initScrollDepth() {
  const marks = [25, 50, 75, 100];
  const fired = {};
  function onScroll() {
    const doc = document.documentElement;
    const scrolled = doc.scrollTop + window.innerHeight;
    const height = doc.scrollHeight;
    const pct = Math.round((scrolled / height) * 100);
    marks.forEach(function (m) {
      if (pct >= m && !fired[m]) {
        fired[m] = true;
        dlPush("scroll_depth", { percent: m });
      }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
