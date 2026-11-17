// Talmur: демо. Без внешних данных, хранилищ и отправки.
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- Высота демо-плашки: шапка липнет сразу под ней ---
  var demoBar = document.getElementById("demoBar");
  function setDemoH() {
    document.documentElement.style.setProperty("--demo-h", demoBar.offsetHeight + "px");
  }
  setDemoH();
  window.addEventListener("resize", setDemoH);

  // --- Шапка и плавающая кнопка при прокрутке ---
  var header = document.getElementById("header");
  var fab = document.getElementById("fab");
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 30);
    fab.classList.toggle("is-on", y > 420);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // --- Появление блоков при прокрутке (при «меньше движения» только проявление, см. CSS) ---
  var reveals = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  // --- Плавающая кнопка прячется, пока на экране чек (чтобы не закрывать его кнопку) ---
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      fab.classList.toggle("is-hidden", entries[0].isIntersecting);
    }).observe(document.getElementById("check"));
  }

  // --- Плавное появление фото после загрузки ---
  document.querySelectorAll(".duo__photo img, .tile img, .rate__photo img, .footer__photo img").forEach(function (img) {
    function ready() { requestAnimationFrame(function () { img.classList.add("is-ready"); }); }
    if (img.complete && img.naturalWidth > 0) ready();
    else { img.addEventListener("load", ready); img.addEventListener("error", ready); }
  });

  // --- Окошко «демо» на все кнопки записи ---
  var modal = document.getElementById("demoModal");
  var modalMsg = document.getElementById("modalMsg");
  function showDemo(msg) {
    modalMsg.textContent = msg || "Здравствуйте! Хочу записаться в Talmur.";
    if (typeof modal.showModal === "function") modal.showModal();
    else window.alert("В полной версии здесь откроется WhatsApp салона");
  }
  document.querySelectorAll("[data-demo]").forEach(function (b) {
    b.addEventListener("click", function () {
      showDemo(b.id === "checkSend" ? checkMessage() : b.dataset.msg);
    });
  });
  document.getElementById("modalClose").addEventListener("click", function () { modal.close(); });
  modal.addEventListener("click", function (e) { if (e.target === modal) modal.close(); });

  // --- Чек визита ---
  // Услуги берём из списка цен; плитки и «+» в списке переключают одно и то же.
  var services = {};
  var order = [];
  document.querySelectorAll(".row").forEach(function (row) {
    var id = row.dataset.id;
    services[id] = {
      name: row.dataset.name,
      min: Number(row.dataset.min),
      max: Number(row.dataset.max),
      on: false
    };
    order.push(id);
    row.querySelector(".add").addEventListener("click", function () { toggle(id); });
  });
  document.querySelectorAll(".tile[data-id]").forEach(function (t) {
    t.addEventListener("click", function () { toggle(t.dataset.id); });
  });

  var list = document.getElementById("checkList");
  var empty = document.getElementById("checkEmpty");
  var sumEl = document.getElementById("checkSum");
  var note = document.getElementById("checkNote");
  var send = document.getElementById("checkSend");
  var clear = document.getElementById("checkClear");

  function money(n) { return n.toLocaleString("ru-RU").replace(/\s/g, " "); }
  function priceText(min, max) { return min === max ? money(min) + " ₸" : money(min) + "–" + money(max) + " ₸"; }

  function picked() { return order.filter(function (id) { return services[id].on; }); }
  function totals() {
    var min = 0, max = 0;
    picked().forEach(function (id) { min += services[id].min; max += services[id].max; });
    return { min: min, max: max };
  }

  function checkMessage() {
    var ids = picked();
    if (!ids.length) return "Здравствуйте! Хочу записаться в Talmur.";
    var names = ids.map(function (id) {
      var n = services[id].name;
      return n.charAt(0).toLowerCase() + n.slice(1);
    }).join(", ");
    var t = totals();
    return "Здравствуйте! Хочу записаться в Talmur: " + names + ". По сайту выходит " + priceText(t.min, t.max) + ".";
  }

  function toggle(id) {
    services[id].on = !services[id].on;
    var on = services[id].on;
    document.querySelectorAll('[data-id="' + id + '"]').forEach(function (el) {
      if (el.classList.contains("tile")) {
        el.setAttribute("aria-pressed", on ? "true" : "false");
        el.querySelector(".tile__icon").textContent = on ? "✓" : "+";
        el.querySelector(".tile__label").textContent = on ? "В чеке" : "В чек";
      } else {
        var b = el.querySelector(".add");
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.textContent = on ? "✓" : "+";
      }
    });
    render();
  }

  function render() {
    while (list.firstChild) list.removeChild(list.firstChild);
    var ids = picked();
    ids.forEach(function (id) {
      var s = services[id];
      var li = document.createElement("li");
      var n = document.createElement("span"); n.textContent = s.name;
      var p = document.createElement("span"); p.className = "price"; p.textContent = priceText(s.min, s.max);
      var x = document.createElement("button");
      x.type = "button"; x.textContent = "×";
      x.setAttribute("aria-label", "Убрать из чека: " + s.name);
      x.addEventListener("click", function () { toggle(id); });
      li.appendChild(n); li.appendChild(p); li.appendChild(x);
      list.appendChild(li);
    });
    var t = totals();
    sumEl.textContent = priceText(t.min, t.max);
    if (!reduceMotion) { sumEl.classList.remove("bump"); void sumEl.offsetWidth; sumEl.classList.add("bump"); }
    empty.hidden = ids.length > 0;
    clear.hidden = ids.length === 0;
    note.hidden = t.min === t.max;
    send.disabled = ids.length === 0;
  }

  clear.addEventListener("click", function () {
    picked().forEach(function (id) { toggle(id); });
  });

  render();
})();
