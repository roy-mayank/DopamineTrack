chrome.alarms.create("batteryTick", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.storage.local.get(["savedBattery", "isWorkMode"], (res) => {
    let battery = res.savedBattery ?? 100;
    let isWorkMode = res.isWorkMode ?? false;

    chrome.tabs.query({ url: "*://*.youtube.com/*" }, (tabs) => {
      const hasYT = tabs.length > 0;

      if (!hasYT || isWorkMode) {
        battery = Math.min(100, battery + 1.66); // +100% in 60 mins
      } else {
        battery = Math.max(0, battery - 3.33); // -100% in 30 mins
      }
      chrome.storage.local.set({ savedBattery: battery });
    });
  });
});
