chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ savedBattery: 100, isWorkMode: false });
});

chrome.alarms.create("batteryTick", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.storage.local.get(["savedBattery", "isWorkMode"], (res) => {
    let battery = res.savedBattery ?? 100; // Backup
    let isWorkMode = res.isWorkMode ?? false;

    chrome.tabs.query({ url: "*://*.youtube.com/*" }, (tabs) => {
      const hasYT = tabs.length > 0;
      if (!hasYT || isWorkMode) {
        battery = Math.min(100, battery + 1.66);
      } else {
        battery = Math.max(0, battery - 3.33);
      }
      chrome.storage.local.set({ savedBattery: battery });
    });
  });
});
