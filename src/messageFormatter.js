const config = require('./config');

function formatTime(ms) {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function generateCaption(currentEvents, upcomingEvents) {
  const now = Date.now();
  let text = '⚔️ <b>ARC RAIDERS</b>\n\n';
  
  // Активные
  if (currentEvents.length > 0) {
    text += '🟢 <b>СЕЙЧАС</b>\n';
    for (const e of currentEvents) {
      const name = config.EVENT_NAMES_RU[e.name] || e.name;
      const map = config.MAP_NAMES_RU[e.map] || e.map;
      const timeLeft = Math.max(0, e.endTime - now);
      const warn = timeLeft < 300000 ? ' 🔴' : '';
      text += `• ${name} — ${map}\n  ⏱ <code>${formatTime(timeLeft)}</code>${warn}\n`;
    }
    text += '\n';
  }
  
  // Скоро (первые 6)
  if (upcomingEvents.length > 0) {
    text += '🟡 <b>СКОРО</b>\n';
    
    const byTime = {};
    for (const e of upcomingEvents.slice(0, 6)) {
      if (!byTime[e.startTime]) byTime[e.startTime] = [];
      byTime[e.startTime].push(e);
    }
    
    for (const t of Object.keys(byTime).sort((a, b) => a - b)) {
      const timeUntil = Math.max(0, Number(t) - now);
      text += `\n🕐 <code>${formatTime(timeUntil)}</code>\n`;
      for (const e of byTime[t]) {
        const name = config.EVENT_NAMES_RU[e.name] || e.name;
        const map = config.MAP_NAMES_RU[e.map] || e.map;
        text += `  • ${name} — ${map}\n`;
      }
    }
  }
  
  // Время обновления
  const time = new Date().toLocaleString('ru-RU', { 
    timeZone: 'Europe/Moscow',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  text += `\n🔄 <code>${time}</code>`;
  
  return text;
}

module.exports = { generateCaption, formatTime };
