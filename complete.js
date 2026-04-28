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

  const rewardPanel = document.getElementById("reward-panel");
  const redeemedPanel = document.getElementById("redeemed-panel");
  const redeemCode = document.getElementById("redeem-code");
  const redeemedCode = document.getElementById("redeemed-code");
  const redeemButton = document.getElementById("redeem-button");

  function readCollected() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch (error) {
      return [];
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

  function isComplete(collected) {
    const collectedSet = new Set(collected);
    return CONFIG.spots.every((spot) => collectedSet.has(spot.id));
  }

  function render() {
    const collected = readCollected();
    if (!isComplete(collected)) {
      window.location.replace("index.html");
      return;
    }

    const code = makeRedeemCode(collected);
    const isRedeemed = localStorage.getItem(redeemedKey) === "true";
    redeemCode.textContent = code;
    redeemedCode.textContent = code;
    rewardPanel.hidden = isRedeemed;
    redeemedPanel.hidden = !isRedeemed;
  }

  redeemButton.addEventListener("click", () => {
    const pin = window.prompt("係員用PINを入力してください");
    if (pin !== CONFIG.staffPin) {
      window.alert("PINが違います。係員に確認してください。");
      return;
    }
    localStorage.setItem(redeemedKey, "true");
    render();
  });

  render();
})();
