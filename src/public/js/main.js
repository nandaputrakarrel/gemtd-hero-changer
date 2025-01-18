// Initialize Lucide icons
lucide.createIcons();

// DOM Elements
const steamIdInput = document.getElementById('steamId');
const submitBtn = document.getElementById('submitBtn');
const errorText = document.getElementById('error');
const featuresSection = document.getElementById('features');
const heroCards = document.getElementById('heroCards');

// Function to handle hero action
async function handleHeroAction(steamId, heroId) {
  try {
    const button = document.querySelector(`button[data-hero="${heroId}"]`);
    button.disabled = true;
    button.innerHTML = `
      <i data-lucide="loader-2" class="animate-spin"></i>
      Processing...
    `;
    lucide.createIcons({
      icons: {
        'loader-2': lucide.icons['loader-2']
      },
      element: button
    });

    const response = await fetch('/gem/set', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        steamId,
        heroId 
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Show success state
    button.style.backgroundColor = 'var(--success)';
    button.innerHTML = `
      <i data-lucide="check"></i>
      Success!
    `;
    lucide.createIcons({
      icons: {
        check: lucide.icons.check
      },
      element: button
    });

    // Reset button after 2 seconds
    setTimeout(() => {
      button.style.backgroundColor = '';
      button.disabled = false;
      button.innerHTML = `
        <i data-lucide="wand-2"></i>
        Select Hero
      `;
      lucide.createIcons({
        icons: {
          'wand-2': lucide.icons['wand-2']
        },
        element: button
      });
    }, 2000);

  } catch (error) {
    console.error('Error:', error);
    const button = document.querySelector(`button[data-hero="${heroId}"]`);
    button.style.backgroundColor = 'var(--error)';
    button.innerHTML = `
      <i data-lucide="x"></i>
      Error
    `;
    lucide.createIcons({
      icons: {
        x: lucide.icons.x
      },
      element: button
    });

    // Reset button after 2 seconds
    setTimeout(() => {
      button.style.backgroundColor = '';
      button.disabled = false;
      button.innerHTML = `
        <i data-lucide="wand-2"></i>
        Select Hero
      `;
      lucide.createIcons({
        icons: {
          'wand-2': lucide.icons['wand-2']
        },
        element: button
      });
    }, 2000);
  }
}

// Function to create a hero card
function createHeroCard(hero) {
  const card = document.createElement('div');
  card.className = 'card';
  
  card.innerHTML = `
    <div class="card-header">
      <img 
        src="${hero.heroImage}" 
        alt="${hero.hero}"
        class="hero-image"
        onerror="this.src='https://cdn.akamai.steamstatic.com/apps/dota2/images/dota_react/heroes/default.png'"
      >
      <h3 class="card-title">${hero.hero}</h3>
    </div>
    <span class="effect-tag">${hero.effect || "No Effect"}</span>
    <ul class="abilities-list">
      ${hero.abilities.map(ability => `
        <li class="ability-item">
          <span class="ability-name">${ability.name}</span>
          <span class="ability-level">Level ${ability.level}</span>
        </li>
      `).join('')}
    </ul>
    <div class="card-action">
      <button 
        class="action-button"
        data-hero="${hero.heroId}"
        onclick="handleHeroAction('${steamIdInput.value}', '${hero.heroId}')"
      >
        <i data-lucide="wand-2"></i>
        Select Hero
      </button>
    </div>
  `;
  
  // Initialize Lucide icons for the action button
  lucide.createIcons({
    icons: {
      'wand-2': lucide.icons['wand-2']
    },
    element: card
  });
  
  return card;
}

// Handle form submission
submitBtn.addEventListener('click', async () => {
  const steamId = steamIdInput.value.trim();
  
  if (!steamId) {
    errorText.textContent = 'Please enter a Steam ID';
    return;
  }
  
  // Clear previous error and show loading state
  errorText.textContent = '';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Loading...';
  
  try {
    const response = await fetch(`/gem/${steamId}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.status === 200 && result.data.heroList) {
      // Clear previous cards
      heroCards.innerHTML = '';
      
      // Create and append new cards
      result.data.heroList.forEach(hero => {
        const card = createHeroCard(hero);
        heroCards.appendChild(card);
      });
      
      // Show the features section
      featuresSection.classList.remove('hidden');
    } else {
      throw new Error('Invalid response format');
    }
    
  } catch (error) {
    console.error('Error:', error);
    errorText.textContent = 'Failed to fetch data. Please try again.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
  }
});