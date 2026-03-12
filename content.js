function todayString() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function formatTotalMinutes(total) {
  if (total < 60) return total + " m";
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m > 0 ? h + "h " + m + "m" : h + "h";
}

function zeros24() {
  return Array(24).fill(0);
}

const hud = document.createElement("div");
hud.id = "dopamine-hud";
hud.innerHTML = `
  <div class="hud-row">
    <span id="stat-text">0 m</span>
    <button id="music-yt-btn" title="Toggle Music / YT mode">Music | YT</button>
    <button id="expand-btn" title="Show graph">▼</button>
    <button id="grayscale-btn" title="B&amp;W on/off">B&amp;W</button>
  </div>
  <div id="graph-panel" class="graph-panel-closed">
    <div class="graph-legend">
      <span class="legend-item"><span class="legend-color music"></span> Music</span>
      <span class="legend-item"><span class="legend-color entertainment"></span> Entertainment</span>
    </div>
    <canvas id="usage-graph" width="240" height="90"></canvas>
  </div>
`;
document.body.appendChild(hud);

const stat = document.getElementById("stat-text");
const musicYtBtn = document.getElementById("music-yt-btn");
const expandBtn = document.getElementById("expand-btn");
const grayscaleBtn = document.getElementById("grayscale-btn");
const graphPanel = document.getElementById("graph-panel");
const canvas = document.getElementById("usage-graph");

let graphOpen = false;

// Load saved state
chrome.storage.local.get(
  ["hudPos", "usageDate", "usageByHourMusic", "usageByHourEntertainment", "grayscaleUserDisabled", "isMusicMode"],
  (res) => {
    if (res.hudPos) {
      hud.style.top = res.hudPos.top;
      hud.style.left = res.hudPos.left;
      hud.style.right = "auto";
    }
    updateUI({
      usageDate: res.usageDate,
      usageByHourMusic: res.usageByHourMusic,
      usageByHourEntertainment: res.usageByHourEntertainment,
      grayscaleUserDisabled: res.grayscaleUserDisabled,
      isMusicMode: res.isMusicMode,
    });
  }
);

// Draggability: don't start drag when clicking buttons or canvas
hud.onmousedown = (e) => {
  if (
    e.target === musicYtBtn ||
    e.target === expandBtn ||
    e.target === grayscaleBtn ||
    e.target === canvas ||
    (graphPanel && graphPanel.contains(e.target))
  )
    return;
  let isDragging = true;
  const shiftX = e.clientX - hud.getBoundingClientRect().left;
  const shiftY = e.clientY - hud.getBoundingClientRect().top;

  const onMove = (e) => {
    if (!isDragging) return;
    hud.style.left = e.clientX - shiftX + "px";
    hud.style.top = e.clientY - shiftY + "px";
    hud.style.right = "auto";
  };
  const onUp = () => {
    isDragging = false;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    chrome.storage.local.set({
      hudPos: { top: hud.style.top, left: hud.style.left },
    });
  };
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
};

musicYtBtn.onclick = () => {
  chrome.storage.local.get("isMusicMode", (res) => {
    const next = !(res.isMusicMode ?? false);
    chrome.storage.local.set({ isMusicMode: next });
    updateMusicYtUI(next);
  });
};

expandBtn.onclick = () => {
  graphOpen = !graphOpen;
  graphPanel.classList.toggle("graph-panel-closed", !graphOpen);
  graphPanel.classList.toggle("graph-panel-open", graphOpen);
  expandBtn.textContent = graphOpen ? "▲" : "▼";
  expandBtn.title = graphOpen ? "Hide graph" : "Show graph";
  if (graphOpen) drawGraph(lastUsageByHourMusic, lastUsageByHourEntertainment);
};

grayscaleBtn.onclick = () => {
  chrome.storage.local.get("grayscaleUserDisabled", (res) => {
    const next = !(res.grayscaleUserDisabled ?? false);
    chrome.storage.local.set({ grayscaleUserDisabled: next });
    updateGrayscaleUI(next);
  });
};

let lastUsageByHourMusic = zeros24();
let lastUsageByHourEntertainment = zeros24();

function drawGraph(usageByHourMusic, usageByHourEntertainment) {
  const music = usageByHourMusic || zeros24();
  const entertainment = usageByHourEntertainment || zeros24();
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const padding = { top: 8, right: 8, bottom: 20, left: 24 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  const totals = music.map((m, i) => (m || 0) + (entertainment[i] || 0));
  const maxVal = Math.max(1, ...totals);

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, w, h);

  const barWidth = chartW / 24;
  for (let i = 0; i < 24; i++) {
    const m = music[i] || 0;
    const e = entertainment[i] || 0;
    const total = m + e;
    if (total === 0) continue;
    const totalHeight = (total / maxVal) * chartH;
    const musicHeight = (m / maxVal) * chartH;
    const entertainmentHeight = (e / maxVal) * chartH;
    const x = padding.left + i * barWidth + 1;

    if (entertainmentHeight > 0) {
      ctx.fillStyle = "#e74c3c";
      ctx.fillRect(x, padding.top + chartH - totalHeight, barWidth - 2, entertainmentHeight);
    }
    if (musicHeight > 0) {
      ctx.fillStyle = "#4a9eff";
      ctx.fillRect(
        x,
        padding.top + chartH - totalHeight + entertainmentHeight,
        barWidth - 2,
        musicHeight
      );
    }
  }

  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1;
  ctx.strokeRect(padding.left, padding.top, chartW, chartH);

  ctx.fillStyle = "#888";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  for (let i = 0; i < 24; i += 6) {
    const x = padding.left + (i + 0.5) * barWidth;
    ctx.fillText(i + "", x, h - 4);
  }
  ctx.textAlign = "right";
  ctx.fillText("min", padding.left - 4, padding.top + 10);
}

function updateMusicYtUI(isMusicMode) {
  musicYtBtn.classList.toggle("music-mode", isMusicMode);
  musicYtBtn.classList.toggle("yt-mode", !isMusicMode);
  musicYtBtn.textContent = isMusicMode ? "Music | YT" : "Music | YT";
  musicYtBtn.title = isMusicMode ? "Currently: Music (click for YT)" : "Currently: YT (click for Music)";
}

function updateGrayscaleUI(grayscaleUserDisabled) {
  grayscaleBtn.classList.toggle("grayscale-off", grayscaleUserDisabled);
  grayscaleBtn.classList.toggle("grayscale-on", !grayscaleUserDisabled);
}

function updateUI(res) {
  const usageDate = res.usageDate ?? todayString();
  const usageByHourMusic = Array.isArray(res.usageByHourMusic) && res.usageByHourMusic.length === 24
    ? res.usageByHourMusic
    : zeros24();
  const usageByHourEntertainment =
    Array.isArray(res.usageByHourEntertainment) && res.usageByHourEntertainment.length === 24
      ? res.usageByHourEntertainment
      : zeros24();
  const grayscaleUserDisabled = res.grayscaleUserDisabled ?? false;
  const isMusicMode = res.isMusicMode ?? false;

  lastUsageByHourMusic = usageByHourMusic;
  lastUsageByHourEntertainment = usageByHourEntertainment;

  const today = todayString();
  const totalMinutes =
    usageDate === today
      ? usageByHourMusic.reduce((a, b) => a + (b || 0), 0) +
        usageByHourEntertainment.reduce((a, b) => a + (b || 0), 0)
      : 0;

  stat.textContent = formatTotalMinutes(totalMinutes);

  const shouldGrayscale = totalMinutes >= 180 && !grayscaleUserDisabled;
  if (shouldGrayscale) {
    document.body.classList.add("depleted-mode");
  } else {
    document.body.classList.remove("depleted-mode");
  }
  updateGrayscaleUI(grayscaleUserDisabled);
  updateMusicYtUI(isMusicMode);

  if (graphOpen) drawGraph(usageByHourMusic, usageByHourEntertainment);
}

setInterval(() => {
  chrome.storage.local.get(
    [
      "usageDate",
      "usageByHourMusic",
      "usageByHourEntertainment",
      "grayscaleUserDisabled",
      "isMusicMode",
    ],
    updateUI
  );
}, 1000);
