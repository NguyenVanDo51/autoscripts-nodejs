chrome.tabs.onCreated.addListener(function(tab) {
  // Kiểm tra nếu URL của tab là YouTube
  if (tab.pendingUrl && !tab.pendingUrl.includes("telegram.org")) {
      // Đóng tab
      chrome.tabs.remove(tab.id);
  }
});
