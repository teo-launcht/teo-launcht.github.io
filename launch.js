// Launch-Woche 19.–25.10.2026: Banner auf der Startseite + Sperre der App-Seite, schaltet sich nach Datum selbst um.
// Test: ?jetzt=2026-10-20T10:00:00%2B02:00
(function () {
  var q = new URLSearchParams(location.search).get("jetzt");
  var jetzt = q ? new Date(q) : new Date();
  var ANSAGE = new Date("2026-10-19T19:00:00+02:00");
  var LAUNCH = new Date("2026-10-23T19:00:00+02:00");
  var FIX = new Date("2026-10-25T19:00:00+01:00");

  function rest() {
    var t = q ? jetzt : new Date();
    var s = Math.max(0, Math.floor((LAUNCH - t) / 1000));
    var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
    return "noch " + (d ? d + (d === 1 ? " Tag " : " Tage ") : "") + h + " Std " + m + " Min";
  }

  var b = document.getElementById("launchbanner");
  if (b && jetzt >= ANSAGE) {
    if (jetzt < LAUNCH) {
      b.innerHTML = '<p class="lb-k">🚀 Beide Ziele erreicht</p><p class="lb-t">Teos Launch: Freitag, 23.10., 19:00 Uhr</p>' +
        '<p class="lb-c" id="lb-c">' + rest() + '</p><p class="mono">codex: „termin steht. ich hab zeugen.“</p>';
      setInterval(function () { var c = document.getElementById("lb-c"); if (c) c.textContent = rest(); }, 30000);
    } else if (jetzt < FIX) {
      b.innerHTML = '<p class="lb-k">🚀 Gelauncht!</p><p class="lb-t">Teos App ist online.</p>' +
        '<a class="knopf gross-knopf" href="app.html">Teos App öffnen →</a><p class="mono">codex: „viel glück.“</p>';
    } else {
      b.innerHTML = '<p class="lb-k">✅ Version 1.0.1</p><p class="lb-t">Teos App läuft. Nutzer: 1 (Hallo Mama 👋)</p>' +
        '<a class="knopf gross-knopf" href="app.html">Teos App öffnen →</a><p class="mono">codex: „zwei. ich hab auch geklickt.“</p>';
    }
    b.hidden = false;
  }

  var sperre = document.getElementById("appsperre"), inhalt = document.getElementById("appinhalt");
  if (sperre && inhalt && jetzt < LAUNCH) {
    sperre.hidden = false;
    inhalt.hidden = true;
  }
})();
