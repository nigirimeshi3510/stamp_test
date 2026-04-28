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
  const redeemedKey = `qr-rally:${CONFIG.eventId}:redeemed`;

  const scanResult = document.getElementById("scan-result");
  const progressText = document.getElementById("progress-text");
  const progressBar = document.getElementById("progress-bar");
  const stampGrid = document.getElementById("stamp-grid");
  const rewardPanel = document.getElementById("reward-panel");
  const redeemedPanel = document.getElementById("redeemed-panel");
  const redeemCode = document.getElementById("redeem-code");
  const redeemedCode = document.getElementById("redeemed-code");
  const redeemButton = document.getElementById("redeem-button");
  const startScanButton = document.getElementById("start-scan-button");
  const stopScanButton = document.getElementById("stop-scan-button");
  const scannerView = document.getElementById("scanner-view");
  const scannerVideo = document.getElementById("scanner-video");
  const scannerHelp = document.getElementById("scanner-help");

  let scannerStream = null;
  let scannerTimer = null;
  let detector = null;

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

  function collectSpot(spot) {
    const collected = new Set(readCollected());
    const wasCollected = collected.has(spot.id);
    collected.add(spot.id);
    writeCollected(Array.from(collected));

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

  function tokenFromScannedValue(value) {
    try {
      return new URL(value).searchParams.get("s");
    } catch (error) {
      return value;
    }
  }

  function stopScanner() {
    if (scannerTimer) {
      window.clearInterval(scannerTimer);
      scannerTimer = null;
    }
    if (scannerStream) {
      scannerStream.getTracks().forEach((track) => track.stop());
      scannerStream = null;
    }
    scannerVideo.srcObject = null;
    scannerView.hidden = true;
    stopScanButton.hidden = true;
    startScanButton.hidden = false;
  }

  async function startScanner() {
    if (!("BarcodeDetector" in window)) {
      scannerHelp.textContent = "このブラウザではページ内QR読み取りに対応していません。iPhone標準カメラでQRを読み取ってください。";
      showMessage("ページ内カメラ読み取りに対応していないブラウザです。標準カメラでQRを読み取ってください。", true);
      return;
    }

    try {
      detector = detector || new BarcodeDetector({ formats: ["qr_code"] });
      scannerStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      scannerVideo.srcObject = scannerStream;
      await scannerVideo.play();
      scannerView.hidden = false;
      stopScanButton.hidden = false;
      startScanButton.hidden = true;
      scannerHelp.textContent = "QRコードを枠の中に入れてください。読み取ると自動で止まります。";

      scannerTimer = window.setInterval(async () => {
        if (!detector || scannerVideo.readyState < 2) return;
        const codes = await detector.detect(scannerVideo);
        if (codes.length === 0) return;

        const token = tokenFromScannedValue(codes[0].rawValue);
        if (token && scanToken(token)) {
          stopScanner();
        }
      }, 350);
    } catch (error) {
      stopScanner();
      scannerHelp.textContent = "カメラを起動できませんでした。Safariのカメラ許可を確認してください。";
      showMessage("カメラを起動できませんでした。ブラウザのカメラ許可を確認してください。", true);
    }
  }

  function makeRedeemCode(collectedIds) {
    const seed = `${CONFIG.eventId}:${collectedIds.sort().join(",")}`;
    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) {
      hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
    }
    return String(hash).slice(-6).padStart(6, "0");
  }

  function render() {
    const collected = readCollected();
    const collectedSet = new Set(collected);
    const count = CONFIG.spots.filter((spot) => collectedSet.has(spot.id)).length;
    const percent = Math.round((count / CONFIG.requiredCount) * 100);
    const code = makeRedeemCode(collected);
    const isComplete = count >= CONFIG.requiredCount;
    const isRedeemed = localStorage.getItem(redeemedKey) === "true";

    progressText.textContent = `${count} / ${CONFIG.requiredCount}`;
    progressBar.style.width = `${Math.min(percent, 100)}%`;
    redeemCode.textContent = code;
    redeemedCode.textContent = code;

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

    rewardPanel.hidden = !isComplete || isRedeemed;
    redeemedPanel.hidden = !isComplete || !isRedeemed;
  }

  redeemButton.addEventListener("click", () => {
    const pin = window.prompt("係員用PINを入力してください");
    if (pin !== CONFIG.staffPin) {
      showMessage("PINが違います。係員に確認してください。", true);
      return;
    }
    localStorage.setItem(redeemedKey, "true");
    render();
  });
  startScanButton.addEventListener("click", startScanner);
  stopScanButton.addEventListener("click", stopScanner);

  scanFromUrl();
  render();
})();
