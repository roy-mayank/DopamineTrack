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

const hud = document.createElement("div");
hud.id = "dopamine-hud";
hud.innerHTML = `
  <div class="hud-row">
    <span id="stat-text">0 m</span>
    <button id="expand-btn" title="Show graph">▼</button>
    <button id="grayscale-btn" title="B&amp;W on/off">B&amp;W</button>
  </div>
  <div id="graph-panel" class="graph-panel-closed">
    <canvas id="usage-graph" width="240" height="90"></canvas>
  </div>
`;
document.body.appendChild(hud);

const stat = document.getElementById("stat-text");
const expandBtn = document.getElementById("expand-btn");
const grayscaleBtn = document.getElementById("grayscale-btn");
const graphPanel = document.getElementById("graph-panel");
const canvas = document.getElementById("usage-graph");

let graphOpen = false;

// Load saved state
chrome.storage.local.get(["hudPos", "usageDate", "usageByHour", "grayscaleUserDisabled"], (res) => {
  if (res.hudPos) {
    hud.style.top = res.hudPos.top;
    hud.style.left = res.hudPos.left;
    hud.style.right = "auto";
  }
  updateUI({
    usageDate: res.usageDate,
    usageByHour: res.usageByHour,
    grayscaleUserDisabled: res.grayscaleUserDisabled,
  });
});

// Draggability: don't start drag when clicking buttons or canvas
hud.onmousedown = (e) => {
  if (e.target === expandBtn || e.target === grayscaleBtn || e.target === canvas || (graphPanel && graphPanel.contains(e.target))) return;
  let isDragging = true;
  const shiftX = e.clientX - hud.getBoundingClientRect().left;
  const shiftY = e.clientY - hud.getBoundingClientRect().top;

  const onMove = (e) => {
    if (!isDragging) return;
    hud.style.left = (e.clientX - shiftX) + "px";
    hud.style.top = (e.clientY - shiftY) + "px";
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

expandBtn.onclick = () => {
  graphOpen = !graphOpen;
  graphPanel.classList.toggle("graph-panel-closed", !graphOpen);
  graphPanel.classList.toggle("graph-panel-open", graphOpen);
  expandBtn.textContent = graphOpen ? "▲" : "▼";
  expandBtn.title = graphOpen ? "Hide graph" : "Show graph";
  if (graphOpen) drawGraph(lastUsageByHour);
};

grayscaleBtn.onclick = () => {
  chrome.storage.local.get("grayscaleUserDisabled", (res) => {
    const next = !(res.grayscaleUserDisabled ?? false);
    chrome.storage.local.set({ grayscaleUserDisabled: next });
    updateGrayscaleUI(next);
  });
};

let lastUsageByHour = Array(24).fill(0);

function drawGraph(usageByHour) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const padding = { top: 8, right: 8, bottom: 20, left: 24 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const maxVal = Math.max(1, ...usageByHour);

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, w, h);

  const barWidth = chartW / 24;
  for (let i = 0; i < 24; i++) {
    const v = usageByHour[i] || 0;
    const barHeight = maxVal > 0 ? (v / maxVal) * chartH : 0;
    const x = padding.left + i * barWidth + 1;
    const y = padding.top + chartH - barHeight;
    ctx.fillStyle = "#4a9eff";
    ctx.fillRect(x, y, barWidth - 2, barHeight);
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

function updateGrayscaleUI(grayscaleUserDisabled) {
  grayscaleBtn.classList.toggle("grayscale-off", grayscaleUserDisabled);
  grayscaleBtn.classList.toggle("grayscale-on", !grayscaleUserDisabled);
}

function updateUI(res) {
  const usageDate = res.usageDate ?? todayString();
  const usageByHour = Array.isArray(res.usageByHour) && res.usageByHour.length === 24
    ? res.usageByHour
    : Array(24).fill(0);
  const grayscaleUserDisabled = res.grayscaleUserDisabled ?? false;

  lastUsageByHour = usageByHour;

  const today = todayString();
  const totalMinutes = usageDate === today
    ? usageByHour.reduce((a, b) => a + (b || 0), 0)
    : 0;

  stat.textContent = formatTotalMinutes(totalMinutes);

  const shouldGrayscale = totalMinutes >= 180 && !grayscaleUserDisabled;
  if (shouldGrayscale) {
    document.body.classList.add("depleted-mode");
  } else {
    document.body.classList.remove("depleted-mode");
  }
  updateGrayscaleUI(grayscaleUserDisabled);

  if (graphOpen) drawGraph(usageByHour);
}

setInterval(() => {
  chrome.storage.local.get(["usageDate", "usageByHour", "grayscaleUserDisabled"], updateUI);
}, 1000);
