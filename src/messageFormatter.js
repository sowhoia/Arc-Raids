const config = require('./config');

const EVENT_ICONS = {
  'Night Raid': '🌙',
  'Electromagnetic Storm': '⚡',
  'Matriarch': '👑',
  'Lush Blooms': '🌸',
  'Harvester': '🔧',
  'Prospecting Probes': '📡',
  'Hidden Bunker': '🏚️',
  'Locked Gate': '🔒',
  'Launch Tower Loot': '🚀',
};

function formatTime(ms) {
  if (ms <= 0) return '00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}ч ${String(m).padStart(2, '0')}м`;
  return `${m}м ${String(s).padStart(2, '0')}с`;
}

function generateCaption(currentEvents, upcomingEvents) {
  const now = Date.now();
  let text = '';
  
  text += '⚔️ <b>ARC RAIDERS</b>  ·  Трекер рейдов\n';
  text += '━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  
  // Активные
  if (currentEvents.length > 0) {
    text += `🟢 <b>СЕЙЧАС АКТИВНЫ</b>  (${currentEvents.length})\n\n`;
    for (const e of currentEvents) {
      const icon = EVENT_ICONS[e.name] || '⚔️';
      const name = config.EVENT_NAMES_RU[e.name] || e.name;
      const map = config.MAP_NAMES_RU[e.map] || e.map;
      const timeLeft = Math.max(0, e.endTime - now);
      const urgent = timeLeft < 300000 ? ' 🔴' : '';
      
      text += `${icon} <b>${name}</b>${urgent}\n`;
      text += `     📍 ${map}  ·  ⏱ <code>${formatTime(timeLeft)}</code>\n\n`;
    }
  } else {
    text += '💤 <i>Нет активных рейдов</i>\n\n';
  }
  
  // Предстоящие
  if (upcomingEvents.length > 0) {
    text += '━━━━━━━━━━━━━━━━━━━━━━━\n';
    text += '🟡 <b>ПРЕДСТОЯЩИЕ</b>\n\n';
    
    const byTime = {};
    for (const e of upcomingEvents.slice(0, 6)) {
      if (!byTime[e.startTime]) byTime[e.startTime] = [];
      byTime[e.startTime].push(e);
    }
    
    for (const t of Object.keys(byTime).sort((a, b) => a - b)) {
      const timeUntil = Math.max(0, Number(t) - now);
      const soon = timeUntil < 600000 ? ' 🟢' : '';
      text += `🕐 Через <code>${formatTime(timeUntil)}</code>${soon}\n`;
      for (const e of byTime[t]) {
        const icon = EVENT_ICONS[e.name] || '⚔️';
        const name = config.EVENT_NAMES_RU[e.name] || e.name;
        const map = config.MAP_NAMES_RU[e.map] || e.map;
        text += `   ${icon} ${name}  ·  📍 ${map}\n`;
      }
      text += '\n';
    }
  }
  
  // Footer
  const time = new Date().toLocaleString('ru-RU', { 
    timeZone: 'Europe/Moscow',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  text += `🔄 <code>${time} МСК</code>`;
  
  return text;
}

module.exports = { generateCaption, formatTime };
