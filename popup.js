document.addEventListener('DOMContentLoaded', () => {
  const pauseButton = document.getElementById('pause');
  const groupWindowsButton = document.getElementById('group-windows');

  // Load saved settings
  chrome.storage.sync.get(['pause', 'groupWindows'], (data) => {
    updateButtonState(pauseButton, data.pause);
    updateButtonState(groupWindowsButton, data.groupWindows);
  });

  // Save settings when buttons are clicked
  pauseButton.addEventListener('click', () => {
    const isActive = !pauseButton.classList.contains('active');
    chrome.storage.sync.set({ pause: isActive });
    updateButtonState(pauseButton, isActive);
  });

  groupWindowsButton.addEventListener('click', () => {
    const isActive = !groupWindowsButton.classList.contains('active');
    chrome.storage.sync.set({ groupWindows: isActive });
    updateButtonState(groupWindowsButton, isActive);
  });

  function updateButtonState(button, isActive) {
    if (isActive) {
      button.classList.add('active');
      button.classList.remove('disabled');
    } else {
      button.classList.remove('active');
      button.classList.add('disabled');
    }
  }
});