// Teo launcht morgen – gemeinsames Skript aller Seiten. Liest window.DATEN (daten.js) und füllt, was es auf der Seite findet.
(function () {
  const D = window.DATEN || {}, nf = new Intl.NumberFormat("de-DE"), $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const K = D.konten || {}, tt = (K.tiktok || {}).n ?? D.follower, ig = (K.instagram || {}).n, ziel = D.ziel || 1000, frei = tt != null && tt >= ziel;
  const datum = iso => iso ? new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) + " Uhr" : "";

  // Zähler (Start- und Launch-Seite)
  if ($("tt")) $("tt").textContent = tt == null ? "–" : nf.format(tt);
  if ($("ig")) $("ig").textContent = ig == null ? "–" : nf.format(ig);
  if ($("tt-u")) $("tt-u").textContent = frei ? "Launch freigeschaltet" : `noch ${nf.format(ziel - tt)} bis zum Launch`;
  if ($("leiste")) $("leiste").style.width = Math.min(100, 100 * (tt || 0) / ziel) + "%";
  if ($("rest")) $("rest").innerHTML = frei ? "Geschafft." : `${nf.format(ziel - tt)} <small>Follower fehlen noch</small>`;
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

  // Geheimcodes (nur SHA-256-Vergleich, freigeschaltete Extras merkt sich der Browser)
  if ($("form")) {
    const SP = "teo_extras";
    const lade = () => { try { return JSON.parse(localStorage.getItem(SP) || "[]"); } catch (e) { return []; } };
    const merke = l => { try { localStorage.setItem(SP, JSON.stringify(l)); } catch (e) {} };
    const zeige = () => { $("extras").innerHTML = lade().map(h => D.codes && D.codes[h] ?
      `<div class="extra"><span>${esc(D.codes[h].titel)}</span><a class="knopf" href="${esc(D.codes[h].link)}" download>Holen</a></div>` : "").join(""); };
    const sha = async t => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))].map(x => x.toString(16).padStart(2, "0")).join("");
    $("form").addEventListener("submit", async e => { e.preventDefault();
      const roh = $("code").value.trim().toUpperCase(); if (!roh) return; const h = await sha(roh);
      if (D.codes && D.codes[h]) { const l = lade(); if (!l.includes(h)) l.push(h); merke(l); $("meldung").textContent = "Freigeschaltet: " + D.codes[h].titel; zeige(); }
      else $("meldung").textContent = "codex: „falscher code.“"; });
    zeige();
  }
})();
