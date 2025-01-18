lucide.createIcons();

const steamIdInput = document.getElementById('steamId');
const submitBtn = document.getElementById('submitBtn');
const errorText = document.getElementById('error');
const featuresSection = document.getElementById('features');
const heroCards = document.getElementById('heroCards');

function createHeroCard(hero) {
  const card = document.createElement('div');
  card.className = 'card';
  
  card.innerHTML = `
    <div class="card-header">
      <i data-lucide="swords"></i>
      <h3 class="card-title">${hero.hero}</h3>
    </div>
    <span class="effect-tag">${hero.effect || 'No Effect'}</span>
    <ul class="abilities-list">
      ${hero.abilities.map(ability => `
        <li class="ability-item">
          <span class="ability-name">${ability.name}</span>
          <span class="ability-level">Level ${ability.level}</span>
        </li>
      `).join('')}
    </ul>
    <button id="submitBtn" class="card-button">Choose Hero</button>
  `;
  
  lucide.createIcons({
    icons: {
      swords: lucide.icons.swords
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
    const response = await fetch(`/gem/${steamId}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.status === 200 && result.data.heroList) {
      heroCards.innerHTML = '';
      
      result.data.heroList.forEach(hero => {
        const card = createHeroCard(hero);
        heroCards.appendChild(card);
      });
      
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