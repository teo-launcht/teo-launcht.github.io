// Ideen-Pool (14.10.2026): Ideen einreichen (erst nach Prüfung sichtbar) + hoch/runter stimmen (eine Stimme pro Idee und Gerät).
// Backend: Cloudflare Worker (01_Kanal/Webseite/ideen_backend). Adresse + Turnstile-Schlüssel stehen im <div id="ideen-cfg">.
(function () {
  const $ = id => document.getElementById(id), cfg = ($("ideen-cfg") || {}).dataset || {}, API = (cfg.api || "").replace(/\/$/, "");
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lies = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const merke = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let geraet = lies("teo_geraet", null);
  if (!geraet) { geraet = crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)); merke("teo_geraet", geraet); }
  const meine = lies("teo_stimmen", {});
  let ideen = [], sortierung = "beliebt";

  const datum = iso => new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  let reihe = [];   /* 16.10.: Reihenfolge bleibt beim Abstimmen stehen (sonst springt die Idee unter dem Finger weg) */
  function zeige(sortieren = true) {
    if (sortieren) reihe = [...ideen].sort((a, b) => sortierung === "neu" ? b.erstellt.localeCompare(a.erstellt) : (b.hoch - b.runter) - (a.hoch - a.runter) || b.erstellt.localeCompare(a.erstellt)).map(i => i.id);
    const l = reihe.map(id => ideen.find(i => i.id === id)).filter(Boolean);
    $("ideen").innerHTML = l.length ? l.map(i => {
      const m = meine[i.id] || 0;   /* 16.10.: Hoch und Runter getrennt zählen und zeigen (Nutzerwunsch) */
      return `<li class="idee${i.status === "gebaut" ? " gebaut" : ""}">
        <div class="itext"><p>${esc(i.text)}</p><span class="klein">${i.name ? esc(i.name) + " · " : ""}${datum(i.erstellt)}${i.status === "gebaut" ? ' · <span class="ok">✓ als Video gebaut</span>' : ""}</span></div>
        <div class="stimmen"><button class="stimme hoch${m === 1 ? " an" : ""}" data-id="${i.id}" data-w="1" aria-pressed="${m === 1}" aria-label="Will ich sehen: ${i.hoch} Stimmen">▲ <b>${i.hoch}</b></button>
          <button class="stimme runter${m === -1 ? " an" : ""}" data-id="${i.id}" data-w="-1" aria-pressed="${m === -1}" aria-label="Eher nicht: ${i.runter} Stimmen">▼ <b>${i.runter}</b></button></div></li>`;
    }).join("") : '<li class="klein">Noch keine Ideen – sei die erste Person!</li>';
  }
  async function laden() {
    if (!API) { $("ideen").innerHTML = '<li class="klein">Der Ideen-Pool startet in Kürze.</li>'; return; }
    try { ideen = (await (await fetch(API + "/api/ideen")).json()).ideen || []; zeige(); }
    catch (e) { $("ideen").innerHTML = '<li class="klein">Ideen gerade nicht erreichbar.</li>'; }
  }
  $("ideen").addEventListener("click", async ev => {
    const b = ev.target.closest(".stimme"); if (!b) return;
    const id = +b.dataset.id, w = +b.dataset.w, neu = meine[id] === w ? 0 : w;
    try {
      const r = await (await fetch(API + "/api/stimme", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, wert: neu, geraet }) })).json();
      if (r.ok) { meine[id] = neu; merke("teo_stimmen", meine); const i = ideen.find(x => x.id === id); i.hoch = r.hoch; i.runter = r.runter; zeige(false); }
    } catch (e) {}
  });
  document.querySelectorAll("[data-sort]").forEach(t => t.addEventListener("click", () => {
    sortierung = t.dataset.sort; document.querySelectorAll("[data-sort]").forEach(x => x.classList.toggle("an", x === t)); zeige(); }));

  $("ideeform").addEventListener("submit", async ev => {
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
  $("ideetext").addEventListener("input", e => { $("zaehler").textContent = e.target.value.length + " / 280"; });
  laden();
})();
