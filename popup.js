document.addEventListener('DOMContentLoaded', async () => {
  const pauseButton = document.getElementById('pause');
  const groupWindowsButton = document.getElementById('group-windows');
  
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

  async function displayTabsForGroup(groupId) {
    const existingTabsSection = document.getElementById('tabs-section-' + groupId);
    if (existingTabsSection) {
        existingTabsSection.remove();
        return;
    }

    try {
        const tabs = await chrome.tabs.query({ groupId: groupId });
        const tabsList = document.createElement('ul');
        tabs.forEach((tab) => {
            const listItem = document.createElement('li');
            listItem.textContent = tab.title;
            tabsList.appendChild(listItem);
        });

        const tabsSection = document.createElement('div');
        tabsSection.id = 'tabs-section-' + groupId;
        tabsSection.appendChild(tabsList);

        const buttonContainer = document.querySelector(`[data-group-id="${groupId}"]`);
        buttonContainer.appendChild(tabsSection);
    } catch (error) {
        console.error('Error displaying tabs for group:', error);
    }
}
  
  function changeGroupColor(groupId) {  
      const existingColorSection = document.getElementById('color-section-' + groupId);
      if (existingColorSection) {
        existingColorSection.remove();
        return; 
      }
      
      const colorSection = document.createElement('div');
      colorSection.id = 'color-section-' + groupId;
      colorSection.className = 'color-section';

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

  try {
    const groups = await chrome.tabGroups.query({});
    groups.forEach((group) => {
      const groupButton = document.createElement('button');
      groupButton.innerHTML = `<i class="fas fa-link"></i> ${group.title}`;
      groupButton.className = 'btn-button-container-buttons group-btn';
      groupButton.style.backgroundColor = getSelectedColor(group.color);
      groupButton.onclick = () => displayTabsForGroup(group.id);
  
      const colorButton = document.createElement('button');
      colorButton.innerHTML = `<i class="fas fa-palette"></i>`;
      colorButton.className = 'btn-button-container-buttons color-btn';
      colorButton.onclick = () => {
        changeGroupColor(group.id);
      };
  
      const closeButton = document.createElement('button');
      closeButton.innerHTML = `<i class="fas fa-times"></i>`;
      closeButton.className = 'btn-button-container-buttons close-btn';
      closeButton.onclick = async () => {
        try {
          const tabs = await chrome.tabs.query({ groupId: group.id });
          const tabIds = tabs.map(tab => tab.id);
          await chrome.tabs.remove(tabIds);
          buttonContainer.remove();
        } catch (error) {
          console.error('Error removing tab group:', error);
        }
      };

      const buttonContainer = document.createElement('div');
      buttonContainer.setAttribute('data-group-id', group.id);
      buttonContainer.className = 'button-container';
      buttonContainer.appendChild(groupButton);
      buttonContainer.appendChild(colorButton);
      buttonContainer.appendChild(closeButton);

      const tabsDisplaySection = document.createElement('div');
      tabsDisplaySection.className = 'tabs-display-section';
      buttonContainer.appendChild(tabsDisplaySection);

      const colorSection = document.createElement('div');
      colorSection.className = 'color-section';
      buttonContainer.appendChild(colorSection);

      document.getElementById('groups-section').appendChild(buttonContainer);

      const hrLine = document.createElement('hr');
      hrLine.style.width = '70%';
      document.getElementById('groups-section').appendChild(hrLine);    
    });
  } catch (error) {
    console.error('Error fetching tab groups:', error);
  }

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

function getSelectedColor(color) {
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

  return colors[color] || '#DADCE0'; 
}