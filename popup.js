document.addEventListener('DOMContentLoaded', async () => {
  const pauseButton = document.getElementById('pause');
  const groupWindowsButton = document.getElementById('group-windows');
  const groupsSection = document.getElementById('groups-section');
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
      const existingColorSection = document.getElementById('color-section-' + groupId);
      if (existingColorSection) {
          existingColorSection.remove();
      }
  
      try {
          const tabs = await chrome.tabs.query({ groupId: groupId });
          const tabsList = document.createElement('ul');
          tabs.forEach((tab) => {
              const listItem = document.createElement('li');
              listItem.textContent = tab.title;
              tabsList.appendChild(listItem);
          });
          const tabsDisplaySection = document.getElementById('tabs-display-section');
          tabsDisplaySection.innerHTML = '';
          tabsDisplaySection.appendChild(tabsList);
      } catch (error) {
          console.error('Error displaying tabs for group:', error);
      }
  }
  
  function changeGroupColor(groupId) {
      const tabsDisplaySection = document.getElementById('tabs-display-section');
      if (tabsDisplaySection) {
          tabsDisplaySection.innerHTML = '';
      }
  
      const existingColorSection = document.getElementById('color-section-' + groupId);
      if (existingColorSection) {
        existingColorSection.remove();
      }function changeGroupColor(groupId) {

  const existingColorSection = document.getElementById('color-section-' + groupId);
  if (existingColorSection) {
    existingColorSection.remove();
  }

  const buttonContainer = document.querySelector(`[data-group-id="${groupId}"]`);
  if (buttonContainer) {
    buttonContainer.appendChild(colorSection);
  } else {
    console.error('Button container not found');
  }
}
      const colorSection = document.createElement('div');
      colorSection.id = 'color-section-' + groupId;
      colorSection.className = 'color-section';
      colorSection.style.display = 'flex';
      colorSection.style.justifyContent = 'space-around';
      colorSection.style.marginTop = '10px';
      
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
        colorButton.className = 'btn-custom color-choice-btn';
        colorButton.style.backgroundColor = value;
        colorButton.style.width = '30px';
        colorButton.style.height = '30px';
        colorButton.style.borderRadius = '50%';
        colorButton.onclick = async () => {
          try {
            await chrome.tabGroups.update(groupId, { color: key });
            console.log(`Group color updated to ${key}`);
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
      groupButton.className = 'btn-custom group-btn';
      groupButton.style.backgroundColor = getSelectedColor(group.color);
      groupButton.onclick = () => displayTabsForGroup(group.id);
  
      const colorButton = document.createElement('button');
      colorButton.innerHTML = `<i class="fas fa-palette"></i> Kleur`;
      colorButton.className = 'btn-custom color-btn';
      colorButton.onclick = () => {
        changeGroupColor(group.id);
      };
  
      const existingButtonContainer = document.querySelector(`[data-group-id="${group.id}"]`);
      if (existingButtonContainer) {
        existingButtonContainer.appendChild(groupButton);
        existingButtonContainer.appendChild(colorButton);
      } else {
        const buttonContainer = document.createElement('div');
        buttonContainer.setAttribute('data-group-id', group.id);
        buttonContainer.className = 'button-container';
        buttonContainer.appendChild(groupButton);
        buttonContainer.appendChild(colorButton);
        groupsSection.appendChild(buttonContainer);
      }
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

groupButton.onclick = () => {
  toggleSectionVisibility(group.id, 'group');
};

colorButton.onclick = () => {
  toggleSectionVisibility(group.id, 'color');
};

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

  return colors[color] || '#DADCE0'; // Standaardkleur als 'color' niet gevonden wordt
}

function toggleSectionVisibility(groupId, sectionType) {
  const sectionId = sectionType === 'group' ? `group-section-${groupId}` : `color-section-${groupId}`;
  const section = document.getElementById(sectionId);
  if (section) {
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
  } else {
    if (sectionType === 'color') {
      changeGroupColor(groupId);
    }
  }
}

function changeGroupColor(groupId) {
  const colorSection = document.createElement('div');
  colorSection.id = 'color-section-' + groupId;
  colorSection.style.display = 'block';
}