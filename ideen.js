// Ideen-Pool (14.10.2026): Ideen einreichen (erst nach Prüfung sichtbar) + hoch/runter stimmen (eine Stimme pro Idee und Gerät).
// Backend: Cloudflare Worker (01_Kanal/Webseite/ideen_backend). Adresse + Turnstile-Schlüssel stehen im <div id="ideen-cfg">.
// 23.10.: Gebaute Ideen raus aus der Abstimmung → eigene Seite umgesetzt.html (Endstand der Stimmen + Links zum Video).
(function () {
  const $ = id => document.getElementById(id), cfg = ($("ideen-cfg") || {}).dataset || {}, API = (cfg.api || "").replace(/\/$/, "");
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lies = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const merke = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  /* Geräte-Kennung erst bei der ersten Stimme anlegen (16.10.: Startseite zeigt den Pool, nicht jeder Besucher stimmt ab) */
  const geraetId = () => { let g = lies("teo_geraet", null);
    if (!g) { g = crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)); merke("teo_geraet", g); }
    return g; };
  /* Startseite: Formular ist eingeklappt; Knopf klappt es auf und lädt erst dann die Bot-Prüfung (Turnstile) */
  const auf = $("ideeauf");
  if (auf && $("ideeform")) auf.addEventListener("click", ev => {
    ev.preventDefault(); $("ideeform").hidden = false; auf.hidden = true;
    if (!window.turnstile && !$("ts-js")) { const s = document.createElement("script"); s.id = "ts-js"; s.async = true;
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"; document.head.appendChild(s); }
    $("ideetext").focus({ preventScroll: true }); $("ideeform").scrollIntoView({ behavior: "smooth", block: "start" }); });
  const meine = lies("teo_stimmen", {});
  const liste = $("ideen"), fertig = $("umgesetzt");
  let ideen = [], sortierung = "beliebt";

  const datum = iso => new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  /* Video-Links kommen nur von uns (Admin); trotzdem nur echte TikTok-/Instagram-/YouTube-Adressen zeigen */
  const PLATTFORMEN = [["tiktok", "TikTok", /^https:\/\/(www\.)?tiktok\.com\//], ["instagram", "Instagram", /^https:\/\/(www\.)?instagram\.com\//],
                       ["youtube", "YouTube", /^https:\/\/(www\.youtube\.com|youtu\.be)\//]];
  const videos = i => { let v = {}; try { v = JSON.parse(i.video || "{}") || {}; } catch (e) {}
    return PLATTFORMEN.filter(([k, , ok]) => typeof v[k] === "string" && ok.test(v[k])).map(([k, n]) => [n, v[k]]); };
  const offen = () => ideen.filter(i => i.status !== "gebaut"), gebaut = () => ideen.filter(i => i.status === "gebaut");

  let reihe = [];   /* 16.10.: Reihenfolge bleibt beim Abstimmen stehen (sonst springt die Idee unter dem Finger weg) */
  function zeige(sortieren = true) {
    if (sortieren) reihe = offen().sort((a, b) => sortierung === "neu" ? b.erstellt.localeCompare(a.erstellt) : (b.hoch - b.runter) - (a.hoch - a.runter) || b.erstellt.localeCompare(a.erstellt)).map(i => i.id);
    const l = reihe.map(id => ideen.find(i => i.id === id)).filter(Boolean);
    liste.innerHTML = l.length ? l.map(i => {
      const m = meine[i.id] || 0;   /* 16.10.: Hoch und Runter getrennt zählen und zeigen (Nutzerwunsch) */
      return `<li class="idee">
        <div class="itext"><p>${esc(i.text)}</p><span class="klein">${i.name ? esc(i.name) + " · " : ""}${datum(i.erstellt)}</span></div>
        <div class="stimmen"><button class="stimme hoch${m === 1 ? " an" : ""}" data-id="${i.id}" data-w="1" aria-pressed="${m === 1}" aria-label="Will ich sehen: ${i.hoch} Stimmen">▲ <b>${i.hoch}</b></button>
          <button class="stimme runter${m === -1 ? " an" : ""}" data-id="${i.id}" data-w="-1" aria-pressed="${m === -1}" aria-label="Eher nicht: ${i.runter} Stimmen">▼ <b>${i.runter}</b></button></div></li>`;
    }).join("") : '<li class="klein">Noch keine Ideen – sei die erste Person!</li>';
    const g = $("gebaut-link"), n = gebaut().length;
    if (g) { g.hidden = !n; g.querySelector("b").textContent = n === 1 ? "1 Idee" : n + " Ideen"; }
  }
  function zeigeFertig() {   /* umgesetzt.html: neueste zuerst, Stimmen als Endstand (keine Knöpfe) */
    const l = gebaut().sort((a, b) => (b.gebaut_am || "").localeCompare(a.gebaut_am || "") || (b.hoch - b.runter) - (a.hoch - a.runter));
    fertig.innerHTML = l.length ? l.map(i => {
      const v = videos(i);
      return `<li class="idee gebaut">
        <div class="itext"><p>${esc(i.text)}</p><span class="klein">${i.name ? esc(i.name) + " · " : ""}eingereicht ${datum(i.erstellt)}${i.gebaut_am ? ` · <span class="ok">✓ gebaut ${datum(i.gebaut_am)}</span>` : ""}</span></div>
        <div class="stimmen endstand" aria-label="Endstand: ${i.hoch} dafür, ${i.runter} dagegen"><span class="stimme hoch">▲ <b>${i.hoch}</b></span><span class="stimme runter">▼ <b>${i.runter}</b></span></div>
        ${v.length ? `<div class="videos">${v.map(([n, u]) => `<a class="knopf" href="${esc(u)}" rel="noopener" target="_blank">▶ Auf ${n} ansehen</a>`).join("")}</div>` : ""}</li>`;
    }).join("") : '<li class="klein">Noch nichts umgesetzt – die erste Folge aus dem Pool kommt bald.</li>';
  }
  async function laden() {
    const ziel = liste || fertig; if (!ziel) return;
    if (!API) { ziel.innerHTML = '<li class="klein">Der Ideen-Pool startet in Kürze.</li>'; return; }
    try { ideen = (await (await fetch(API + "/api/ideen")).json()).ideen || []; if (liste) zeige(); if (fertig) zeigeFertig(); }
    catch (e) { ziel.innerHTML = '<li class="klein">Ideen gerade nicht erreichbar.</li>'; }
  }
  if (liste) liste.addEventListener("click", async ev => {
    const b = ev.target.closest(".stimme"); if (!b) return;
    const id = +b.dataset.id, w = +b.dataset.w, neu = meine[id] === w ? 0 : w;
    try {
      const r = await (await fetch(API + "/api/stimme", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, wert: neu, geraet: geraetId() }) })).json();
      if (r.ok) { meine[id] = neu; merke("teo_stimmen", meine); const i = ideen.find(x => x.id === id); i.hoch = r.hoch; i.runter = r.runter; zeige(false); }
    } catch (e) {}
  });
  document.querySelectorAll("[data-sort]").forEach(t => t.addEventListener("click", () => {
    sortierung = t.dataset.sort; document.querySelectorAll("[data-sort]").forEach(x => x.classList.toggle("an", x === t)); zeige(); }));

  if ($("ideeform")) $("ideeform").addEventListener("submit", async ev => {
    ev.preventDefault(); const m = $("ideemeldung"), f = ev.target;
    if (!API) { m.textContent = "Der Ideen-Pool startet in Kürze."; return; }
    const tok = (f.querySelector('[name="cf-turnstile-response"]') || {}).value || "";
    m.textContent = "sende …";
    try {
      const r = await (await fetch(API + "/api/ideen", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: $("ideetext").value, name: $("ideename").value, website: $("website").value, turnstile: tok }) })).json();
      if (r.ok) { m.textContent = r.hinweis; $("ideetext").value = ""; $("zaehler").textContent = "0 / 280"; }
      else m.textContent = r.fehler || "Hat nicht geklappt.";
    } catch (e) { m.textContent = "Gerade nicht erreichbar – später nochmal?"; }
    if (window.turnstile) try { window.turnstile.reset(); } catch (e) {}
  });
  if ($("ideetext")) $("ideetext").addEventListener("input", e => { $("zaehler").textContent = e.target.value.length + " / 280"; });
  laden();
})();
