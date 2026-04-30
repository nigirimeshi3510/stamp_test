(function () {
  const CONFIG = {
    eventId: "sample-qr-rally-2026",
    requiredCount: 3,
    staffPin: "2026",
    spots: [
      { id: "spot-a", token: "A7K2-MORI", name: "スポット A" },
      { id: "spot-b", token: "B4Q9-KAWA", name: "スポット B" },
      { id: "spot-c", token: "C8N5-SORA", name: "スポット C" }
    ]
  };

  const storageKey = `qr-rally:${CONFIG.eventId}`;

  const scanResult = document.getElementById("scan-result");
  const progressText = document.getElementById("progress-text");
  const progressBar = document.getElementById("progress-bar");
  const stampGrid = document.getElementById("stamp-grid");
  const completePanel = document.getElementById("complete-panel");
  const completeButton = document.getElementById("complete-button");

  function readCollected() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch (error) {
      return [];
    }
  }

  function writeCollected(ids) {
    localStorage.setItem(storageKey, JSON.stringify(ids));
  }

  function showMessage(message, isError) {
    scanResult.textContent = message;
    scanResult.className = `panel notice is-visible${isError ? " is-error" : ""}`;
  }

  function isComplete(collected) {
    const collectedSet = new Set(collected);
    return CONFIG.spots.every((spot) => collectedSet.has(spot.id));
  }

  function collectSpot(spot) {
    const collected = new Set(readCollected());
    const wasCollected = collected.has(spot.id);
    collected.add(spot.id);
    const collectedIds = Array.from(collected);
    writeCollected(collectedIds);

    showMessage(
      wasCollected
        ? `${spot.name} は取得済みです。`
        : `${spot.name} のスタンプを取得しました。`,
      false
    );
    render();
  }

  function scanToken(token) {
    const spot = CONFIG.spots.find((item) => item.token === token);
    if (!spot) {
      showMessage("このQRコードは認識できませんでした。貼り紙が最新か確認してください。", true);
      return false;
    }
    collectSpot(spot);
    return true;
  }

  function scanFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("s");
    if (!token) return;

    scanToken(token);
  }

  function render() {
    const collected = readCollected();
    const collectedSet = new Set(collected);
    const count = CONFIG.spots.filter((spot) => collectedSet.has(spot.id)).length;
    const percent = Math.round((count / CONFIG.requiredCount) * 100);

    progressText.textContent = `${count} / ${CONFIG.requiredCount}`;
    progressBar.style.width = `${Math.min(percent, 100)}%`;

    stampGrid.innerHTML = "";
    CONFIG.spots.forEach((spot, index) => {
      const isCollected = collectedSet.has(spot.id);
      const card = document.createElement("article");
      card.className = `stamp-card${isCollected ? " is-collected" : ""}`;
      card.innerHTML = `
        <div class="stamp-icon" aria-hidden="true">${isCollected ? "済" : index + 1}</div>
        <p class="stamp-name">${spot.name}</p>
        <p class="stamp-state">${isCollected ? "取得済み" : "未取得"}</p>
      `;
      stampGrid.appendChild(card);
    });

    completePanel.hidden = !isComplete(collected);
  }

  completeButton.addEventListener("click", () => {
    window.location.href = "complete.html";
  });

  scanFromUrl();
  render();
})();
