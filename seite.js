// Teo launcht morgen – gemeinsames Skript aller Seiten. Liest window.DATEN (daten.js) und füllt, was es auf der Seite findet.
(function () {
  const D = window.DATEN || {}, nf = new Intl.NumberFormat("de-DE"), $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const K = D.konten || {}, Z = D.ziele || { tiktok: 1000, instagram: 500 };
  const n = pl => (K[pl] || {}).n, fehlt = pl => Math.max(0, Z[pl] - (n(pl) || 0)), geschafft = pl => n(pl) != null && n(pl) >= Z[pl];
  const frei = geschafft("tiktok") && geschafft("instagram");
  const datum = iso => iso ? new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) + " Uhr" : "";

  // Zähler + Balken je Plattform (Start- und Launch-Seite): Launch erst, wenn BEIDE Ziele erreicht sind
  for (const pl of ["tiktok", "instagram"]) {
    const k = pl === "tiktok" ? "tt" : "ig";
    if ($(k)) $(k).textContent = n(pl) == null ? "–" : nf.format(n(pl));
    if ($(k + "-z")) $(k + "-z").textContent = nf.format(Z[pl]);
    if ($(k + "-l")) $(k + "-l").style.width = Math.min(100, 100 * (n(pl) || 0) / Z[pl]) + "%";
    if ($(k + "-u")) $(k + "-u").textContent = geschafft(pl) ? "Ziel erreicht ✓" : `noch ${nf.format(fehlt(pl))} bis zum Launch`;
  }
  if ($("rest")) $("rest").innerHTML = frei ? "Geschafft." : `${nf.format(fehlt("tiktok") + fehlt("instagram"))} <small>fehlen noch</small>`;
  if ($("stand")) $("stand").textContent = "Stand TikTok: " + datum((K.tiktok || {}).stand || D.stand) + " · Instagram: " + datum((K.instagram || {}).stand);
  if ($("app") && frei) { $("app").classList.add("frei");
    $("app").innerHTML = '<h3>Teos App ist da.</h3><p class="lead">Endlich gelauncht. Was soll schon schiefgehen?</p><div class="knoepfe"><a class="knopf" href="app.html">App öffnen</a></div>'; }

  // Werkzeugkiste
  if ($("karten")) $("karten").innerHTML = (D.karten || []).map((k, i) => `<details class="karte"${i === 0 ? " open" : ""}><summary><span class="tag">${esc(k.folge)}</span><h3>${esc(k.titel)}</h3></summary>
    <ul>${k.punkte.map(p => `<li>${esc(p)}</li>`).join("")}</ul>
    ${k.links && k.links.length ? `<div class="links">${k.links.map(([t, u]) => `<a href="${esc(u)}" rel="noopener">${esc(t)} ↗</a>`).join("")}</div>` : ""}
    ${k.hinweis ? `<p class="klein">${esc(k.hinweis)}</p>` : ""}</details>`).join("");

  // Setup
  if ($("setup")) $("setup").innerHTML = (D.setup || []).map(([t, b, u]) => `<a class="tool" href="${esc(u)}" rel="noopener"><b>${esc(t)}</b><span>${esc(b)} ↗</span></a>`).join("");

  // Geheimcodes: Extras liegen verschlüsselt in daten.js (AES-256-GCM, Schlüssel = PBKDF2(Code)). Richtiger Code = Entschlüsseln klappt.
  if ($("form")) {
    const SP = "teo_extras_v2", C = D.codes || { liste: [] };
    const lade = () => { try { return JSON.parse(localStorage.getItem(SP) || "[]"); } catch (e) { return []; } };
    const merke = l => { try { localStorage.setItem(SP, JSON.stringify(l)); } catch (e) {} };
    const zeige = () => { $("extras").innerHTML = lade().map(x => `<div class="extra"><span>${esc(x.titel)}</span><a class="knopf" href="${esc(x.link)}" download>Holen</a></div>`).join(""); };
    const b = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
    async function probiere(code) {
      const roh = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]);
      for (const e of C.liste) {
        const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: b(e.s), iterations: C.iter, hash: "SHA-256" }, roh, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
        try { return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b(e.iv) }, key, b(e.c)))); } catch (x) {}
      }
      return null;
    }
    $("form").addEventListener("submit", async ev => { ev.preventDefault();
      const code = $("code").value.trim().toUpperCase(); if (!code) return;
      $("meldung").textContent = "prüfe …";
      const x = await probiere(code);
      if (x) { const l = lade().filter(y => y.link !== x.link); l.push(x); merke(l); $("meldung").textContent = "Freigeschaltet: " + x.titel; zeige(); }
      else $("meldung").textContent = "codex: „falscher code.“"; });
    zeige();
  }
})();
