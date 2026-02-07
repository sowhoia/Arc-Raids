require('dotenv').config();

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  CHAT_ID: Number(process.env.CHAT_ID),
  API_URL: process.env.API_URL || 'https://metaforge.app/api/arc-raiders/events-schedule',
  
  // Интервал обновления (секунды) - фото+caption
  UPDATE_INTERVAL: Number(process.env.UPDATE_INTERVAL) || 5,
  
  // Кэш API (минуты)
  API_REFRESH_INTERVAL: Number(process.env.API_REFRESH_INTERVAL) || 2,
  
  // Цвета карт
  MAP_COLORS: {
    'Dam': '#4A90D9',
    'Stella Montis': '#9B59B6',
    'Blue Gate': '#27AE60',
    'Spaceport': '#E67E22',
    'Buried City': '#E74C3C'
  },
  
  // Названия карт на русском
  MAP_NAMES_RU: {
    'Dam': 'Дамба',
    'Stella Montis': 'Стелла Монтис',
    'Blue Gate': 'Синие Врата',
    'Spaceport': 'Космопорт',
    'Buried City': 'Погребённый Город'
  },
  
  // Названия событий на русском
  EVENT_NAMES_RU: {
    'Night Raid': 'Ночной Рейд',
    'Electromagnetic Storm': 'ЭМ Шторм',
    'Matriarch': 'Матриарх',
    'Lush Blooms': 'Пышное Цветение',
    'Harvester': 'Жнец',
    'Prospecting Probes': 'Разведзонды',
    'Hidden Bunker': 'Скрытый Бункер',
    'Locked Gate': 'Запертые Врата',
    'Launch Tower Loot': 'Лут Пусковой Башни'
  }
};
