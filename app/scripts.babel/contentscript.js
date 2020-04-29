'use strict';

let getMetaContent = (platform) => {
  let el = document.head.querySelector(
    `meta[property="al:${platform}:url"][content]`
  );

  if (el) {
    return el.content;
  }

  return undefined;
};

let appLinks = {
  android: getMetaContent('android'),
  ios: getMetaContent('ios'),
  web: getMetaContent('web'),
};

let hasAppLink = Object.keys(appLinks).some((o) => {
  return appLinks[o];
});

chrome.runtime.sendMessage({
  type: 'HAS_APPLINK',
  data: hasAppLink,
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case 'OPEN_APP':
      if (hasAppLink) {
        window.open(appLinks.web || appLinks.android || appLinks.ios, '_blank');
      }
  }
});
