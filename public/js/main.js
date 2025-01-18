lucide.createIcons();

const steamIdInput = document.getElementById('steamId');
const submitBtn = document.getElementById('submitBtn');
const clearBtn = document.getElementById('clearBtn');
const errorText = document.getElementById('error');
const featuresSection = document.getElementById('features');
const heroCards = document.getElementById('heroCards');
const featuresTitle = document.getElementById('featuresTitle');
const headerImage = document.getElementById('headerImage');

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

    const response = await fetch('/api/gem/set', {
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
  
  lucide.createIcons({
    icons: {
      'wand-2': lucide.icons['wand-2']
    },
    element: card
  });
  
  return card;
}

submitBtn.addEventListener('click', async () => {
  const steamId = steamIdInput.value.trim();
  
  if (!steamId) {
    errorText.textContent = 'Please enter a Steam ID';
    return;
  }
  
  errorText.textContent = '';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Loading...';
  
  try {
    const response = await fetch(`/api/gem/${steamId}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      if (response.status == 404) {
        throw new Error("Account not found.")
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.data.heroList) {
      heroCards.innerHTML = '';

      featuresTitle.textContent = result.data.playerInformation.name || 'Hero Information';
      headerImage.src = result.data.playerInformation.avatar || '';
      
      result.data.heroList.forEach(hero => {
        const card = createHeroCard(hero);
        heroCards.appendChild(card);
      });
      
      featuresSection.classList.remove('hidden');
    } else {
      throw new Error('Could not process');
    }
    
  } catch (error) {
    errorText.textContent = error.message;
    featuresSection.classList.add('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
  }
});

