document.addEventListener('DOMContentLoaded', () => {
    const pauseCheckbox = document.getElementById('pause');
    const groupWindowsCheckbox = document.getElementById('group-windows');
  
    // Load saved settings
    chrome.storage.sync.get(['pause', 'groupWindows'], (data) => {
      pauseCheckbox.checked = data.pause || false;
      groupWindowsCheckbox.checked = data.groupWindows || false;
    });
  
    // Save settings when checkboxes change
    pauseCheckbox.addEventListener('change', () => {
      chrome.storage.sync.set({ pause: pauseCheckbox.checked });
    });
  
    groupWindowsCheckbox.addEventListener('change', () => {
      chrome.storage.sync.set({ groupWindows: groupWindowsCheckbox.checked });
    });
  });
  