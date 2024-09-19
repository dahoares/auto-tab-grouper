/**
 * @fileoverview This file contains the JavaScript code for the popup window.
 */
document.addEventListener('DOMContentLoaded', async () => {

  try {
    const groups = await chrome.tabGroups.query({});
    const noActiveGroups = document.getElementById('no-active-groups');

    if (groups.length === 0) {
      noActiveGroups.style.display = 'block';
    } else {
      noActiveGroups.style.display = 'none';
      groups.forEach((group) => {
      });
    }
  } catch (error) {
    console.error('Error fetching tab groups:', error);
  }

  const pauseButton = document.getElementById('pause');
  const groupWindowsButton = document.getElementById('group-windows');

  // Retrieve the values of 'pause' and 'groupWindows' from the Chrome storage
  chrome.storage.sync.get(['pause', 'groupWindows'], (data) => {
    updateButtonState(pauseButton, data.pause);
    updateButtonState(groupWindowsButton, data.groupWindows);
  });

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

  /**
   * Displays the tabs for a given group ID.
   *
   * @param {number} groupId - The ID of the group.
   * @returns {Promise<void>} - A promise that resolves when the tabs are displayed.
   * @throws {Error} - If there is an error displaying the tabs.
   */
  async function displayTabsForGroup(groupId) {
    const existingTabsSection = document.getElementById('tabs-section-' + groupId);
    if (existingTabsSection) {
        existingTabsSection.remove();
        return;
    }

    try {
        const tabs = await chrome.tabs.query({ groupId: groupId });
        const tabsSection = document.createElement('div');
        tabsSection.className = 'tabssection ';
        tabsSection.id = 'tabs-section-' + groupId;

        tabs.forEach((tab) => {
            const tabButton = document.createElement('button');
            tabButton.textContent = tab.title;
            tabButton.className = 'tab-button';
            tabButton.onclick = () => {
                chrome.tabs.update(tab.id, { active: true });
            };

            const closeButton = document.createElement('button');
            closeButton.textContent = '✖';
            closeButton.className = 'tab-close-btn';
            closeButton.onclick = async (event) => {
                event.stopPropagation();
                await chrome.tabs.remove(tab.id);
                tabButton.remove();
                noteContainer.remove();
            };

            const noteContainer = document.createElement('div');
            noteContainer.className = 'tab-note-container';
            const noteInput = document.createElement('input');
            noteInput.type = 'text';
            noteInput.className = 'tab-note-input';
            noteInput.placeholder = 'Add a note...';
            
            const tabUrl = tab.url;
            getTabNoteByUrl(tabUrl, (note) => {
                noteInput.value = note;
            });
            noteInput.addEventListener('input', (event) => {
                saveTabNoteByUrl(tabUrl, event.target.value);
            });
            
            noteContainer.appendChild(noteInput);
            tabButton.appendChild(closeButton);
            tabsSection.appendChild(tabButton);
            tabsSection.appendChild(noteContainer);
        });

        const buttonContainer = document.querySelector(`[data-group-id="${groupId}"]`);
        buttonContainer.appendChild(tabsSection);
    } catch (error) {
        console.error('Error displaying tabs for group:', error);
    }
}
  
  /**
   * Changes the color of a tab group.
   * If the color section for the group already exists, it is removed.
   * If the color section does not exist, it is created and appended to the group button container.
   * Clicking on a color button updates the group color and the background color of the group button.
   *
   * @param {number} groupId - The ID of the tab group.
   */
  function changeGroupColor(groupId) {  
      const existingColorSection = document.getElementById('color-section-' + groupId);
      if (existingColorSection) {
        existingColorSection.remove();
        return; 
      }
      
      const colorSection = document.createElement('div');
      colorSection.id = 'color-section-' + groupId;
      colorSection.className = 'color-section';
      
      Object.entries(colors).forEach(([key, value]) => {
        const colorButton = document.createElement('button');
        colorButton.className = 'color-choice-btn';
        colorButton.style.backgroundColor = value;
        colorButton.onclick = async () => {
          try {
            await chrome.tabGroups.update(groupId, { color: key });
            console.log(`Group color updated to ${key}`);

            const groupButton = document.querySelector(`[data-group-id="${groupId}"] .group-btn`);
            if (groupButton) {
              groupButton.style.backgroundColor = value;
            } else {
              console.error('Group button not found');
            }
          } catch (error) {
            console.error('Error updating group color:', error);
          }
        };
        colorSection.appendChild(colorButton);
      });
      
      const groupButtonContainer = document.querySelector(`[data-group-id="${groupId}"]`);
      if (groupButtonContainer) {
        groupButtonContainer.appendChild(colorSection);
      } else {
        console.error('Group button container not found');
      }
  }

  // Display existing tab groups
  try {
    const groups = await chrome.tabGroups.query({});
    groups.forEach((group) => {
      // Create a button for the group
      const groupButton = document.createElement('button');
      groupButton.innerHTML = `<i class="fas fa-link"></i> ${group.title}`;
      groupButton.className = 'btn-button-container-buttons group-btn';
      groupButton.style.backgroundColor = getSelectedColor(group.color);
      groupButton.onclick = async () => {
        // Display the tabs for the group
        displayTabsForGroup(group.id);
        const tabs = await chrome.tabs.query({ groupId: group.id });
        if (tabs.length > 0) {
          const windowId = tabs[0].windowId;
          chrome.windows.update(windowId, { focused: true });
        }
      
        const existingColorSection = document.getElementById('color-section-' + group.id);
        if (existingColorSection) {
          existingColorSection.remove();
        }
      };

      // Create a button for changing the group color
      const colorButton = document.createElement('button');
      colorButton.innerHTML = `<i class="fas fa-palette"></i>`;
      colorButton.className = 'btn-button-container-buttons color-btn';
      colorButton.onclick = () => {
        // Change the color of the group
        changeGroupColor(group.id);
        const existingTabsSection = document.getElementById('tabs-section-' + group.id);
        if (existingTabsSection) {
          existingTabsSection.remove();
        }
      };

      // Create a button for closing the group
      const closeButton = document.createElement('button');
      closeButton.innerHTML = `<i class="fas fa-times"></i>`;
      closeButton.className = 'btn-button-container-buttons close-btn';
      closeButton.onclick = async () => {
        try {
          // Remove all tabs in the group
          const tabs = await chrome.tabs.query({ groupId: group.id });
          const tabIds = tabs.map(tab => tab.id);
          await chrome.tabs.remove(tabIds);
          buttonContainer.remove();
        } catch (error) {
          console.error('Error removing tab group:', error);
        }
      };

      // Create a container for the buttons and tabs display section
      const buttonContainer = document.createElement('div');
      buttonContainer.setAttribute('data-group-id', group.id);
      buttonContainer.className = 'button-container';
      buttonContainer.appendChild(groupButton);
      buttonContainer.appendChild(colorButton);
      buttonContainer.appendChild(closeButton);

      // Create a section for displaying the tabs
      const tabsDisplaySection = document.createElement('div');
      tabsDisplaySection.className = 'tabs-display-section';
      buttonContainer.appendChild(tabsDisplaySection);

      // Create a section for changing the group color
      const colorSection = document.createElement('div');
      colorSection.className = 'color-section';
      buttonContainer.appendChild(colorSection);

      // Append the button container to the groups section
      document.getElementById('groups-section').appendChild(buttonContainer);

      // Add a horizontal line separator
      const hrLine = document.createElement('hr');
      hrLine.style.width = '70%';
      document.getElementById('groups-section').appendChild(hrLine);
    });
  } catch (error) {
    console.error('Error fetching tab groups:', error);
  }
});

const colors = {
  grey: '#DADCE0',
  blue: '#8AB4F8',
  red: '#F28B82',
  yellow: '#FDD663',
  green: '#81C995',
  pink: '#FF8BCB',
  purple: '#C58AF9',
  cyan: '#78D9EC',
  orange: '#FCAD70'
}; 

/**
* Updates the state of a button based on the isActive parameter.
* @param {HTMLElement} button - The button element to update.
* @param {boolean} isActive - Indicates whether the button should be active or disabled.
* @returns {void}
*/
function updateButtonState(button, isActive) {
  if (isActive) {
    button.classList.add('active');
    button.classList.remove('disabled');
  } else {
    button.classList.remove('active');
    button.classList.add('disabled');
 }
}
  
/**
 * Retrieves the corresponding color code based on the given color name.
 * @param {string} color - The name of the color.
 * @returns {string} The color code associated with the given color name, or the default color code if no match is found.
 */


function getSelectedColor(color) {
  return colors[color] || '#DADCE0'; 
}

function saveTabNoteByUrl(tabUrl, note) {
  chrome.storage.sync.set({ [`tabNote_${tabUrl}`]: note });
}

function getTabNoteByUrl(tabUrl, callback) {
  chrome.storage.sync.get([`tabNote_${tabUrl}`], (result) => {
    callback(result[`tabNote_${tabUrl}`] || '');
  });
}