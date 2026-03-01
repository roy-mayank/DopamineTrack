function todayString() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

chrome.runtime.onInstalled.addListener(() => {
  const usageByHour = Array(24).fill(0);
  chrome.storage.local.set({
    usageDate: todayString(),
    usageByHour,
    grayscaleUserDisabled: false,
  });
});

chrome.alarms.create("usageTick", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== "usageTick") return;
  const now = new Date();
  const today = todayString();
  const currentHour = now.getHours();

  chrome.storage.local.get(["usageDate", "usageByHour"], (res) => {
    let usageDate = res.usageDate ?? today;
    let usageByHour = Array.isArray(res.usageByHour) && res.usageByHour.length === 24
      ? [...res.usageByHour]
      : Array(24).fill(0);

    if (usageDate !== today) {
      usageDate = today;
      usageByHour = Array(24).fill(0);
    }

    chrome.tabs.query({ url: ["*://*.youtube.com/*", "*://*.123series.stream/*"] }, (tabs) => {
      const hasYT = tabs.length > 0;
      if (hasYT) {
        usageByHour[currentHour] = (usageByHour[currentHour] || 0) + 1;
      }
      chrome.storage.local.set({ usageDate, usageByHour });
    });
  });
});
