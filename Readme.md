# 🔋 Mindful YouTube Consumption Tool

- Readme.md written completely using Gemini Pro

**YT overuse Tracker** is a Chrome Extension built to break YouTube addiction. Instead of a hard block, it treats your browsing time like a limited resource (energy). It forces a distinction between "Productive" use (work/music) and "Mindless" use (scrolling).

## 🧠 The "Shower Thought" Logic

This project was born from a simple hypothesis: **If the energy spent searching for YouTube videos was diverted into social interaction, things might improve.**

The extension creates a "vacuum" for your attention. When your energy runs out, the "fun" part of YouTube dies (grayscale, no recommendations), and you are prompted to reconnect with the real world.

---

## ✨ Features

- **Draggable HUD:** A persistent battery bar that you can move anywhere on the YouTube interface. It remembers its position across sessions.
- **Smart Background Logic:** Using a `background.js` service worker, the battery recharges even when YouTube is closed.
- **Dual-Speed Calibration:** - **Drain:** 100% to 0% in **30 minutes** (Normal browsing).
  - **Recharge:** 0% to 100% in **60 minutes** (Background or Work Mode).
- **Restricted State:** At 0%, the site enters "Depletion Mode"—everything turns grayscale and the distracting sidebar is hidden.
- **Social Mission Overlay:** At 0%, you are given a social task (e.g., "Text an old friend"). You must type a name to commit to the task before the restriction is lifted. (name is not really stored or referenced later tho. This is just symbolic)
- **Work/Music Toggle (🎧/💼):** A manual override that recharges the battery while you work, with an auto-revert safety to prevent "infinite" cheating.

---

## 🛠️ Installation (Local Developer Mode)

Since this is a custom tool, you can install it manually:

1.  **Clone/Download** this repository to a local folder.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** (toggle in the top-right corner).
4.  Click **Load unpacked** and select the folder containing these files.
5.  Refresh YouTube and look for the battery in the top right!

---

## 📁 Repository Structure

| File            | Role                                                  |
| :-------------- | :---------------------------------------------------- |
| `manifest.json` | Extension metadata and permissions.                   |
| `background.js` | The "Heartbeat" — tracks battery levels 24/7.         |
| `content.js`    | The "Interface" — handles dragging, UI, and missions. |
| `style.css`     | The "Look" — battery gradients and grayscale filters. |

---

## 🚀 How to Use

1.  **Placement:** Click and drag the battery bar to a spot that doesn't block your player controls.
2.  **Productivity:** Click the `🎧/💼` button when watching tutorials or listening to music. You'll see a `⚡` icon indicating a recharge.
3.  **The Mission:** When the bar hits 0%, don't panic. Read the mission, think of a person, type their name, and then actually send that text.

---

## 🔧 Customization

Want to add your own friends' names or specific social goals? Edit the `missions` array in `content.js`:

```

```
