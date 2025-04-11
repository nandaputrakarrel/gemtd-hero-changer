async function calculate(wave, progress, mobCount, currentKill) {
  try {
    const maxWave = 50;
    var result = [];
    for (wave+1; wave <= maxWave; wave++) {
      if ((wave % 10) == 0) {
        progress = progress + 10;
        currentKill = currentKill + 10;
      } else {
        progress = progress + (mobCount * 0.75);
        currentKill = currentKill + mobCount;
      }

      if (Math.floor(progress) > 100) {
        mobCount = mobCount + 1;
        progress = progress - 50;
      }
      
      result.push({
        wave: wave,
        maxProgress: Math.floor(progress),
        mobCount: mobCount,
        maxKill: currentKill
      });
    }
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.log(error)
    return {
      success: false,
      status: error.statusCode,
      message: error.message
    }
  }
}

module.exports = {
  calculate
}