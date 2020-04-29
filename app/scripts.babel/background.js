'use strict';

chrome.browserAction.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, {
    type: 'OPEN_APP',
  });
});

const icons = [
  { path: { '16': 'images/icon-16.png', '32': 'images/icon-32.png' } },
  { path: { '16': 'images/icon-16-off.png', '32': 'images/icon-32-off.png' } },
];

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case 'HAS_APPLINK':
      if (msg.data) {
        chrome.browserAction.setIcon(
          Object.assign({ tabId: sender.tab.id }, icons[0])
        );
      } else {
        chrome.browserAction.setIcon(
          Object.assign({ tabId: sender.tab.id }, icons[1])
        );
      }
      break;
  }
});
