lucide.createIcons();

const steamIdInput = document.getElementById('steamId');
const submitBtn = document.getElementById('submitBtn');
const clearBtn = document.getElementById('clearBtn');
const errorText = document.getElementById('error');
const featuresSection = document.getElementById('features');
const heroCards = document.getElementById('heroCards');
const featuresTitle = document.getElementById('featuresTitle');
const headerImage = document.getElementById('headerImage');

function createHeroCard(hero) {
  const card = document.createElement('div');
  card.className = 'card';

  const cardHeader = document.createElement('div');
  cardHeader.className = 'card-header';

  const heroImage = document.createElement('img');
  heroImage.className = 'hero-image';
  heroImage.src = hero.heroImage;
  heroImage.alt = hero.hero;

  const cardTitle = document.createElement('h3');
  cardTitle.className = 'card-title';
  cardTitle.textContent = hero.hero;

  cardHeader.appendChild(heroImage);
  cardHeader.appendChild(cardTitle);
  card.appendChild(cardHeader);

  if (hero.effect) {
    const effectTag = document.createElement('span');
    effectTag.className = 'effect-tag';
    effectTag.textContent = hero.effect;
    card.appendChild(effectTag);
  }

  if (hero.abilities && hero.abilities.length > 0) {
    const abilitiesList = document.createElement('ul');
    abilitiesList.className = 'abilities-list';

    hero.abilities.forEach(ability => {
      const abilityItem = document.createElement('li');
      abilityItem.className = 'ability-item';

      const abilityName = document.createElement('span');
      abilityName.className = 'ability-name';
      abilityName.textContent = ability.name;

      const abilityLevel = document.createElement('span');
      abilityLevel.className = 'ability-level';
      abilityLevel.textContent = `Level ${ability.level}`;

      abilityItem.appendChild(abilityName);
      abilityItem.appendChild(abilityLevel);
      abilitiesList.appendChild(abilityItem);
    });

    card.appendChild(abilitiesList);
  }

  const cardAction = document.createElement('div');
  cardAction.className = 'card-action';

  const actionButton = document.createElement('button');
  actionButton.className = 'action-button';
  actionButton.innerHTML = '<i data-lucide="check"></i>Select Hero';
  actionButton.addEventListener('click', async () => {
    try {
      actionButton.disabled = true;
      actionButton.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i>Selecting...';
      lucide.createIcons();

      const response = await fetch('/api/gem/set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          steamId: steamIdInput.value.trim(),
          heroId: hero.heroId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      actionButton.innerHTML = '<i data-lucide="check"></i>Selected!';
      actionButton.classList.add('success');
      actionButton.disabled = false;
      
      setTimeout(() => {
        actionButton.innerHTML = '<i data-lucide="check"></i>Select Hero';
        actionButton.classList.remove('success');
        lucide.createIcons();
      }, 2000);
    } catch (error) {
      actionButton.innerHTML = '<i data-lucide="alert-triangle"></i>Failed';
      actionButton.classList.add('error');
      actionButton.disabled = false;
      console.error('Error:', error);
    }
    lucide.createIcons();
  });

  cardAction.appendChild(actionButton);
  card.appendChild(cardAction);

  return card;
}

steamIdInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    submitBtn.click();
  }
});

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
      
      document.querySelector('.hero').classList.add('hidden');
      featuresSection.classList.remove('hidden');
      setTimeout(() => {
        featuresSection.classList.add('visible');
        floatingBackBtn.classList.remove('hidden');
      }, 100);
    } else {
      throw new Error('Could not process');
    }
    
  } catch (error) {
    errorText.textContent = error.message;
    featuresSection.classList.add('hidden');
    featuresSection.classList.remove('visible');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
  }
});

const floatingBackBtn = document.getElementById('floatingBackBtn');

const handleBackToHero = () => {
  featuresSection.classList.remove('visible');
  setTimeout(() => {
    steamIdInput.value = '';
    featuresSection.classList.add('hidden');
    document.querySelector('.hero').classList.remove('hidden');
    floatingBackBtn.classList.add('hidden');
  }, 500);
};

floatingBackBtn.addEventListener('click', handleBackToHero);

