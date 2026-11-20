(() => {
  const cards = [...document.querySelectorAll(".card")];
  const filterBar = document.querySelector(".filters");
  const filterButtons = [...filterBar.querySelectorAll("button")];
  const resultCount = document.querySelector("#result-count");
  const dialog = document.querySelector("#profile-dialog");
  const heading = document.querySelector("#profile-heading");
  const image = document.querySelector("#profile-image");
  const body = document.querySelector("#profile-body");
  const close = dialog.querySelector(".close");
  let selected = 0;
  let opener = null;
  let side = "front";
  const sideButtons = [...dialog.querySelectorAll(".side-switch button")];

  function applyFilter(borough) {
    for (const card of cards) card.hidden = borough !== "all" && card.dataset.borough !== borough;
    for (const button of filterButtons)
      button.setAttribute("aria-pressed", String(button.dataset.filter === borough));
    resultCount.textContent = cards.filter((card) => !card.hidden).length + "人のシールを表示しています。";
  }

  for (const button of filterButtons)
    button.addEventListener("click", () => applyFilter(button.dataset.filter));
  filterBar.hidden = false;
  if (typeof dialog.showModal !== "function") return;

  function updateSide(card) {
    const info = card.dataset;
    image.src = side === "back"
      ? card.querySelector(".profile-back-link").getAttribute("href")
      : info.image;
    image.alt = info.reading + "のシール" + (side === "back" ? "裏面" : "表面");
    for (const button of sideButtons)
      button.setAttribute("aria-pressed", String(button.dataset.side === side));
  }

  function show(card, trigger, initialSide = "front") {
    if (!card) return;
    if (!dialog.open) {
      opener = trigger || card.querySelector("summary");
      side = initialSide;
    }
    selected = cards.indexOf(card);
    const info = card.dataset;
    updateSide(card);
    document.querySelector("#profile-roman").textContent = info.roman;
    const reading = document.createElement("small");
    reading.textContent = info.reading;
    heading.replaceChildren(info.name, reading);
    body.replaceChildren(card.querySelector(".profile").cloneNode(true));
    const visible = cards.filter((item) => !item.hidden);
    document.querySelector("#profile-index").textContent = visible.indexOf(card) + 1 + " / " + visible.length;
    if (!dialog.open) {
      dialog.showModal();
      close.focus({ preventScroll: true });
    }
    dialog.scrollTop = 0;
  }

  for (const card of cards) {
    const summary = card.querySelector("summary");
    summary.addEventListener("click", (event) => {
      event.preventDefault();
      show(card, summary);
    });
  }
  for (const link of document.querySelectorAll("[data-open]")) {
    link.addEventListener("click", (event) => {
      const card = document.getElementById(link.dataset.open);
      if (!card) return;
      event.preventDefault();
      if (card.hidden) applyFilter("all");
      show(card, link, link.dataset.side || "front");
    });
  }

  for (const button of sideButtons)
    button.addEventListener("click", () => {
      side = button.dataset.side;
      updateSide(cards[selected]);
    });

  function step(offset) {
    const visible = cards.filter((item) => !item.hidden);
    const position = visible.indexOf(cards[selected]);
    show(visible[(position + offset + visible.length) % visible.length]);
  }

  for (const button of dialog.querySelectorAll("[data-step]"))
    button.addEventListener("click", () => step(Number(button.dataset.step)));
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      step(event.key === "ArrowRight" ? 1 : -1);
    }
  });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX >= rect.right ||
      event.clientY < rect.top ||
      event.clientY >= rect.bottom
    )
      dialog.close();
  });
  dialog.addEventListener("close", () => {
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  });
  function showLinkedProfile() {
    const isBack = location.hash.endsWith("-back");
    const id = location.hash.slice(1).replace(/-back$/, "");
    const card = cards.find((item) => item.id === id);
    if (!card) return;
    if (card.hidden) applyFilter("all");
    if (dialog.open) side = isBack ? "back" : "front";
    show(card, null, isBack ? "back" : "front");
  }
  window.addEventListener("hashchange", showLinkedProfile);
  showLinkedProfile();
})();
