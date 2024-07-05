chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const newUrl = new URL(tab.url);
    const newBaseUrl = `${newUrl.protocol}//${newUrl.hostname}`;

    chrome.tabs.query({}, (tabs) => {
      const tabsToUpdate = tabs.filter(t => {
        const tabUrl = new URL(t.url);
        return tabUrl.hostname === newUrl.hostname;
      });

      if (tabsToUpdate.length > 1) {
        const groupName = newUrl.hostname;

        chrome.tabGroups.query({}, (groups) => {
          let existingGroup = groups.find(g => g.title === groupName);

          if (existingGroup) {
            const tabIds = tabsToUpdate.map(t => t.id);
            chrome.tabs.group({
              groupId: existingGroup.id,
              tabIds: tabIds
            });
          } else {
            chrome.tabs.group({ tabIds: tabsToUpdate.map(t => t.id) }, (groupId) => {
              chrome.tabGroups.update(groupId, { title: groupName });
            });
          }
        });
      } else {
        chrome.tabGroups.query({}, (groups) => {
          groups.forEach(group => {
            chrome.tabs.query({ groupId: group.id }, (groupTabs) => {
              if (groupTabs.length === 1) {
                chrome.tabs.ungroup(groupTabs[0].id);
              }
            });
          });
        });
      }
    });
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    const newUrl = new URL(tab.url);
    const newBaseUrl = `${newUrl.protocol}//${newUrl.hostname}`;

    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const tabsToUpdate = tabs.filter(t => {
        const tabUrl = new URL(t.url);
        return tabUrl.hostname === newUrl.hostname;
      });

      if (tabsToUpdate.length > 1) {
        const groupName = newUrl.hostname; 

        chrome.tabGroups.query({}, (groups) => {
          let existingGroup = groups.find(g => g.title === groupName);

          if (existingGroup) {
            const tabIds = tabsToUpdate.map(t => t.id);
            chrome.tabs.group({
              groupId: existingGroup.id,
              tabIds: tabIds
            });
          } else {
            chrome.tabs.group({ tabIds: tabsToUpdate.map(t => t.id) }, (groupId) => {
              chrome.tabGroups.update(groupId, { title: groupName });
            });
          }
        });
      } else {
        chrome.tabGroups.query({}, (groups) => {
          groups.forEach(group => {
            chrome.tabs.query({ groupId: group.id }, (groupTabs) => {
              if (groupTabs.length === 1) {
                chrome.tabs.ungroup(groupTabs[0].id);
              }
            });
          });
        });
      }
    });
  });
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  chrome.tabGroups.query({}, (groups) => {
    groups.forEach(group => {
      chrome.tabs.query({ groupId: group.id }, (groupTabs) => {
        if (groupTabs.length === 1) {
          chrome.tabs.ungroup(groupTabs[0].id);
        }
      });
    });
  });
});
