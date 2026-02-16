let battery = 100;
let missionAccomplished = false;

const hud = document.createElement("div");
hud.id = "dopamine-hud";
hud.innerHTML = `
    <div id="battery-container">
        <div id="battery-fill"></div>
        <span id="stat-text">100%</span>
    </div>
    <button id="mode-toggle">🎧/💼</button>
`;
document.body.appendChild(hud);

const fill = document.getElementById("battery-fill");
const stat = document.getElementById("stat-text");
const btn = document.getElementById("mode-toggle");

// Load Saved State
chrome.storage.local.get(["savedBattery", "hudPos", "isWorkMode"], (res) => {
  if (res.savedBattery !== undefined) battery = res.savedBattery;
  if (res.hudPos) {
    hud.style.top = res.hudPos.top;
    hud.style.left = res.hudPos.left;
    hud.style.right = "auto";
  }
  updateModeUI(res.isWorkMode);
  updateUI(res);
});

// Draggability Logic
let isDragging = false;
hud.onmousedown = (e) => {
  if (e.target === btn) return;
  isDragging = true;
  let shiftX = e.clientX - hud.getBoundingClientRect().left;
  let shiftY = e.clientY - hud.getBoundingClientRect().top;

  document.onmousemove = (e) => {
    if (!isDragging) return;
    let x = e.clientX - shiftX;
    let y = e.clientY - shiftY;
    hud.style.left = x + "px";
    hud.style.top = y + "px";
    hud.style.right = "auto";
  };

  document.onmouseup = () => {
    isDragging = false;
    document.onmousemove = null;
    chrome.storage.local.set({
      hudPos: { top: hud.style.top, left: hud.style.left },
    });
  };
};

btn.onclick = () => {
  chrome.storage.local.get("isWorkMode", (res) => {
    let nextMode = !res.isWorkMode;
    chrome.storage.local.set({ isWorkMode: nextMode });
    updateModeUI(nextMode);
  });
};

function updateModeUI(isWorkMode) {
  if (isWorkMode) {
    hud.classList.add("recharging");
    btn.style.background = "#38ed38";
  } else {
    hud.classList.remove("recharging");
    btn.style.background = "#333";
  }
}

function updateUI(res) {
  battery = res.savedBattery || 0;
  const isWork = res.isWorkMode || false;

  fill.style.width = battery + "%";

  // Design change: Green above 40, Red under
  if (battery <= 40) {
    hud.classList.add("low-battery");
  } else {
    hud.classList.remove("low-battery");
  }

  stat.innerText = (isWork ? "⚡ " : "") + Math.floor(battery) + "%";

  // Trigger Mission
  if (
    battery <= 0 &&
    !missionAccomplished &&
    !document.getElementById("mission-overlay")
  ) {
    showMission();
  }

  // Reset mission flag only when user has earned some juice
  if (battery > 5) {
    missionAccomplished = false;
  }

  // Restriction Toggles (Only updates if state changes to save CPU)
  if (battery <= 0) {
    if (!document.body.classList.contains("depleted-mode")) {
      document.body.classList.add("depleted-mode");
    }
  } else {
    document.body.classList.remove("depleted-mode");
  }
}

// Check state every second
setInterval(() => {
  chrome.storage.local.get(["savedBattery", "isWorkMode"], updateUI);
}, 1000);

function showMission() {
  const missions = [
    "Check Meetup/Eventbrite/GroupMe/PAACH",
    "Voice Message someone rn",
    "Apply to an internship",
    "Journal/Meditate",
    "Text anyone rn",
    "Cold N/w-ing",
  ];
  const selected = missions[Math.floor(Math.random() * missions.length)];

  // Create the actual HTML elements (This was missing!)
  const overlay = document.createElement("div");
  overlay.id = "mission-overlay";
  overlay.innerHTML = `
      <div class="mission-card">
          <h2 style="color: #ff4b2b;">Dopamine Empty</h2>
          <p>${selected}</p>
          <input type="text" id="target-name" placeholder="Name?">
          <br>
          <button id="submit-mission">Done</button>
          <p id="skip-mission" style="font-size: 10px; margin-top: 10px; cursor: pointer; color: #888;">Skip (Bad Day)</p>
      </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById("submit-mission").onclick = () => {
    const val = document.getElementById("target-name").value;
    if (val.trim().length > 1) {
      missionAccomplished = true;
      overlay.remove();
    }
  };

  document.getElementById("skip-mission").onclick = () => {
    missionAccomplished = true;
    overlay.remove();
  };
}
