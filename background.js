function groupTabs(tabsToUpdate, groupName) {
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
}

function ungroupTab(tabId) {
  chrome.tabs.ungroup(tabId);
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.storage.sync.get(['pause', 'groupWindows'], (data) => {
    if (data.pause) return; // Exit if paused

    if (changeInfo.status === 'complete') {
      const newUrl = new URL(tab.url);
      const newBaseUrl = `${newUrl.protocol}//${newUrl.hostname}`;

      const queryOptions = data.groupWindows ? {} : { currentWindow: true };
      chrome.tabs.query(queryOptions, (tabs) => {
        const tabsToUpdate = tabs.filter(t => {
          const tabUrl = new URL(t.url);
          return tabUrl.hostname === newUrl.hostname;
        });

        if (tabsToUpdate.length > 1) {
          const groupName = newUrl.hostname;
          groupTabs(tabsToUpdate, groupName);
        } else {
          // Ungroup the tab if it doesn't match the base URL of the other tabs in the group
          chrome.tabGroups.query({}, (groups) => {
            groups.forEach(group => {
              chrome.tabs.query({ groupId: group.id }, (groupTabs) => {
                groupTabs.forEach(groupTab => {
                  const groupTabUrl = new URL(groupTab.url);
                  if (groupTab.id === tabId && groupTabUrl.hostname !== newUrl.hostname) {
                    ungroupTab(groupTab.id);
                  }
                });
              });
            });
          });
        }
      });
    }
  });
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.storage.sync.get(['pause', 'groupWindows'], (data) => {
    if (data.pause) return; // Exit if paused

    chrome.tabs.get(activeInfo.tabId, (tab) => {
      const newUrl = new URL(tab.url);
      const newBaseUrl = `${newUrl.protocol}//${newUrl.hostname}`;

      const queryOptions = data.groupWindows ? {} : { currentWindow: true };
      chrome.tabs.query(queryOptions, (tabs) => {
        const tabsToUpdate = tabs.filter(t => {
          const tabUrl = new URL(t.url);
          return tabUrl.hostname === newUrl.hostname;
        });

        if (tabsToUpdate.length > 1) {
          const groupName = newUrl.hostname;
          groupTabs(tabsToUpdate, groupName);
        } else {
          // Ungroup the tab if it doesn't match the base URL of the other tabs in the group
          chrome.tabGroups.query({}, (groups) => {
            groups.forEach(group => {
              chrome.tabs.query({ groupId: group.id }, (groupTabs) => {
                groupTabs.forEach(groupTab => {
                  const groupTabUrl = new URL(groupTab.url);
                  if (groupTab.id === activeInfo.tabId && groupTabUrl.hostname !== newUrl.hostname) {
                    ungroupTab(groupTab.id);
                  }
                });
              });
            });
          });
        }
      });
    });
  });
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  chrome.storage.sync.get(['pause', 'groupWindows'], (data) => {
    if (data.pause) return; // Exit if paused

    chrome.tabGroups.query({}, (groups) => {
      groups.forEach(group => {
        chrome.tabs.query({ groupId: group.id }, (groupTabs) => {
          if (groupTabs.length === 1) {
            ungroupTab(groupTabs[0].id);
          }
        });
      });
    });
  });
});
