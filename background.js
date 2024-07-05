async function groupTabs(tabsToUpdate, groupName) {
  const retryDelay = 1000;
  const maxAttempts = 3; 
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      const tabs = await chrome.tabs.query({});
      const groups = await chrome.tabGroups.query({});
      let existingGroup = groups.find(g => g.title === groupName);

      const tabIds = tabsToUpdate.map(t => t.id).filter(id => tabs.some(tab => tab.id === id));
      if (tabIds.length === 0) return;

      if (existingGroup) {
        if (existingGroup.collapsed) {
          await chrome.tabGroups.update(existingGroup.id, { collapsed: false });
        }
        await groupTabsInGroup(existingGroup.id, tabIds);
      } else {
        const groupId = await chrome.tabs.group({ tabIds: tabIds });
        await chrome.tabGroups.update(groupId, { title: groupName });
      }
      break;
    } catch (error) {
      console.error('Error grouping tabs:', error);
      attempt++;
      if (attempt < maxAttempts) {
        console.log(`Retrying... Attempt ${attempt + 1} of ${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error('Failed to group tabs after multiple attempts.');
      }
    }
  }
}

async function groupTabsInGroup(groupId, tabIds) {
  try {
    await chrome.tabs.group({
      groupId: groupId,
      tabIds: tabIds
    });
  } catch (error) {
    console.error('Error grouping tabs:', error);
  }
}

function ungroupTab(tabId) {
  chrome.tabs.ungroup(tabId);
}

function isValidHttpUrl(string) {
  let url;
  
  try {
    url = new URL(string);
  } catch (_) {
    return false;  
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

function retryOperation(operation, delay = 1000, attempts = 3) {
  return new Promise((resolve, reject) => {
    const attemptOperation = attempts => {
      operation()
        .then(resolve)
        .catch(error => {
          if (attempts > 0) {
            setTimeout(() => attemptOperation(attempts - 1), delay);
          } else {
            reject(error);
          }
        });
    };

    attemptOperation(attempts);
  });
}

async function manageTabGrouping(tabIds, groupName, maxAttempts = 3, retryDelay = 1000) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      let existingGroup = await findExistingGroup(groupName);
      if (existingGroup) {
        await updateGroupAndAddTabs(existingGroup.id, tabIds, existingGroup.collapsed);
      } else {
        const groupId = await chrome.tabs.group({ tabIds: tabIds });
        await chrome.tabGroups.update(groupId, { title: groupName });
      }
      return;
    } catch (error) {
      console.error('Error grouping tabs:', error);
      attempt++;
      if (attempt < maxAttempts) {
        console.log(`Retrying... Attempt ${attempt} of ${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error('Failed to group tabs after multiple attempts.');
        throw new Error('Failed to group tabs after multiple attempts.'); 
      }
    }
  }
}

async function updateGroupAndAddTabs(groupId, tabIds, isCollapsed) {
  if (isCollapsed) {
    await chrome.tabGroups.update(groupId, { collapsed: false });
  }
  await groupTabsInGroup(groupId, tabIds);
}


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && isValidHttpUrl(tab.url)) {
    const newUrl = new URL(tab.url);
    const newBaseUrl = `${newUrl.protocol}//${newUrl.hostname}`;

    if (tab.groupId && tab.groupId > 0) {
      chrome.tabGroups.get(tab.groupId, (group) => {
        if (group.title !== newBaseUrl) {
          ungroupTab(tabId);
        }
      });
    }

    chrome.storage.sync.get(['pause', 'groupWindows'], (data) => {
      if (data.pause) return; // Exit if paused

      const queryOptions = data.groupWindows ? {} : { currentWindow: true };
      chrome.tabs.query(queryOptions, (tabs) => {
        const tabsToUpdate = tabs.filter(t => isValidHttpUrl(t.url) && new URL(t.url).hostname === newUrl.hostname);

        if (tabsToUpdate.length > 1) {
          const groupName = newUrl.hostname;
          retryOperation(() => groupTabs(tabsToUpdate, groupName));
        } else {
          // Ungroup the tab if it doesn't match the base URL of the other tabs in the group
          chrome.tabGroups.query({}, (groups) => {
            groups.forEach(group => {
              chrome.tabs.query({ groupId: group.id }, (groupTabs) => {
                groupTabs.forEach(groupTab => {
                  if (isValidHttpUrl(groupTab.url)) {
                    const groupTabUrl = new URL(groupTab.url);
                    if (groupTab.id === tabId && groupTabUrl.hostname !== newUrl.hostname) {
                      ungroupTab(groupTab.id);
                    }
                  }
                });
              });
            });
          });
        }
      });
    });
  }
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
    if (data.pause) return;

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
