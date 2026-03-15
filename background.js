function todayString() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function zeros24() {
  return Array(24).fill(0);
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    usageDate: todayString(),
    usageByHourMusic: zeros24(),
    usageByHourEntertainment: zeros24(),
    grayscaleUserDisabled: false,
    isMusicMode: false,
  });
});

chrome.alarms.create("usageTick", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== "usageTick") return;
  const now = new Date();
  const today = todayString();
  const currentHour = now.getHours();

  chrome.storage.local.get(
    ["usageDate", "usageByHour", "usageByHourMusic", "usageByHourEntertainment", "isMusicMode"],
    (res) => {
      let usageDate = res.usageDate ?? today;
      let usageByHourMusic = Array.isArray(res.usageByHourMusic) && res.usageByHourMusic.length === 24
        ? [...res.usageByHourMusic]
        : null;
      let usageByHourEntertainment = Array.isArray(res.usageByHourEntertainment) && res.usageByHourEntertainment.length === 24
        ? [...res.usageByHourEntertainment]
        : null;

      if (usageByHourMusic === null || usageByHourEntertainment === null) {
        if (Array.isArray(res.usageByHour) && res.usageByHour.length === 24) {
          usageByHourEntertainment = [...res.usageByHour];
          usageByHourMusic = zeros24();
        } else {
          usageByHourMusic = zeros24();
          usageByHourEntertainment = zeros24();
        }
      }

      if (usageDate !== today) {
        usageDate = today;
        usageByHourMusic = zeros24();
        usageByHourEntertainment = zeros24();
      }

      const isMusicMode = res.isMusicMode ?? false;

      chrome.tabs.query({ url: ["*://*.youtube.com/*", "*://*.123series.stream/*"] }, (tabs) => {
        if (tabs.length === 0) {
          chrome.storage.local.set({
            usageDate,
            usageByHourMusic,
            usageByHourEntertainment,
          });
          return;
        }
        let pending = tabs.length;
        let hasPlaying = false;
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { type: "isVideoPlaying" }, (res) => {
            if (!chrome.runtime.lastError && res && res.playing) hasPlaying = true;
            pending--;
            if (pending === 0) {
              if (hasPlaying) {
                if (isMusicMode) {
                  usageByHourMusic[currentHour] = (usageByHourMusic[currentHour] || 0) + 1;
                } else {
                  usageByHourEntertainment[currentHour] = (usageByHourEntertainment[currentHour] || 0) + 1;
                }
              }
              chrome.storage.local.set({
                usageDate,
                usageByHourMusic,
                usageByHourEntertainment,
              });
            }
          });
        });
      });
    }
  );
});
