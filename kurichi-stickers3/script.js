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

  function show(card, trigger) {
    if (!card) return;
    if (!dialog.open) opener = trigger || card.querySelector("summary");
    selected = cards.indexOf(card);
    const info = card.dataset;
    image.src = info.image;
    image.alt = info.reading + "のシール表面";
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
      show(card, link);
    });
  }

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
    const card = cards.find((item) => "#" + item.id === location.hash);
    if (!card) return;
    if (card.hidden) applyFilter("all");
    show(card);
  }
  window.addEventListener("hashchange", showLinkedProfile);
  showLinkedProfile();
})();
