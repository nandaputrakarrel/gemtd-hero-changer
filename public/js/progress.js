lucide.createIcons();

const currentWaveInput = document.getElementById('currentWave');
const currentProgressInput = document.getElementById('currentProgress');
const currentMobCountInput = document.getElementById('currentMobCount');
const currentKillInput = document.getElementById('currentKill');
const calculateBtn = document.getElementById('calculateBtn');
const errorText = document.getElementById('error');
const resultsSection = document.getElementById('results');
const progressTableBody = document.getElementById('progressTableBody');
const floatingBackBtn = document.getElementById('floatingBackBtn');

function createTableRow(data) {
    const row = document.createElement('tr');
    
    const waveCell = document.createElement('td');
    waveCell.textContent = data.wave;
    
    const progressCell = document.createElement('td');
    progressCell.textContent = `${data.maxProgress}%`;
    
    const mobCountCell = document.createElement('td');
    mobCountCell.textContent = data.mobCount;
    
    const killCell = document.createElement('td');
    killCell.textContent = data.maxKill;
    
    row.appendChild(waveCell);
    row.appendChild(progressCell);
    row.appendChild(mobCountCell);
    row.appendChild(killCell);
    
    return row;
}

calculateBtn.addEventListener('click', async () => {
    const wave = parseInt(currentWaveInput.value);
    const percentage = parseInt(currentProgressInput.value);
    const mobCount = parseInt(currentMobCountInput.value);
    const kill = parseInt(currentKillInput.value);
    
    if (!wave || !percentage || !mobCount) {
        errorText.textContent = 'Please fill in all fields';
        return;
    }
    
    if (wave < 1 || wave > 49) {
        errorText.textContent = 'Wave must be between 1 and 49';
        return;
    }
    
    if (percentage < 0 || percentage > 100) {
        errorText.textContent = 'Percentage must be between 0 and 100';
        return;
    }
    
    if (mobCount < 0) {
        errorText.textContent = 'Mob count must be greater than or equal to 0';
        return;
    }
    
    errorText.textContent = '';
    calculateBtn.disabled = true;
    calculateBtn.textContent = 'Calculating...';
    
    try {
        // Placeholder API call - replace with actual endpoint when ready
        const response = await fetch(`/api/progress/calculate?currentWave=${wave}&currentProgress=${percentage}&currentMobCount=${mobCount}&currentKill=${kill}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to calculate progress');
        }
        
        const result = await response.json();
        
        if (result.data) {
            progressTableBody.innerHTML = '';
            
            result.data.forEach(item => {
                const row = createTableRow(item);
                progressTableBody.appendChild(row);
            });
            
            document.querySelector('.hero').classList.add('hidden');
            resultsSection.classList.remove('hidden');
            setTimeout(() => {
                resultsSection.classList.add('visible');
                floatingBackBtn.classList.remove('hidden');
            }, 100);
        }
    } catch (error) {
        errorText.textContent = error.message;
        resultsSection.classList.add('hidden');
        resultsSection.classList.remove('visible');
    } finally {
        calculateBtn.disabled = false;
        calculateBtn.textContent = 'Calculate';
    }
});

const handleBackToCalculator = () => {
    resultsSection.classList.remove('visible');
    setTimeout(() => {
        currentWaveInput.value = '1';
        currentProgressInput.value = '50';
        currentMobCountInput.value = '10';
        currentKillInput.value = '0';
        resultsSection.classList.add('hidden');
        document.querySelector('.hero').classList.remove('hidden');
        floatingBackBtn.classList.add('hidden');
    }, 500);
};

floatingBackBtn.addEventListener('click', handleBackToCalculator);