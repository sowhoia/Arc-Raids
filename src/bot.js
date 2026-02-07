const { Telegraf } = require('telegraf');
const config = require('./config');
const { fetchEvents, categorizeEvents } = require('./api');
const { generateRaidImage } = require('./imageGenerator');
const { generateCaption } = require('./messageFormatter');

if (!config.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN не указан! Создайте .env файл (см. .env.example)');
  process.exit(1);
}
if (!config.CHAT_ID) {
  console.error('❌ CHAT_ID не указан! Создайте .env файл (см. .env.example)');
  process.exit(1);
}

const bot = new Telegraf(config.BOT_TOKEN);

const state = {
  messageId: null,
  isUpdating: false,
  updateCount: 0
};

async function getEventsData() {
  const events = await fetchEvents();
  return categorizeEvents(events);
}

// Обновить фото + caption через editMessageMedia
async function updateMessage() {
  if (!state.messageId || state.isUpdating) return true;
  
  state.isUpdating = true;
  try {
    const { current, upcoming } = await getEventsData();
    const imageBuffer = await generateRaidImage(current, upcoming);
    const caption = generateCaption(current, upcoming);
    
    await bot.telegram.editMessageMedia(
      config.CHAT_ID,
      state.messageId,
      undefined,
      {
        type: 'photo',
        media: { source: imageBuffer },
        caption,
        parse_mode: 'HTML'
      }
    );
    
    state.isUpdating = false;
    return true;
  } catch (error) {
    state.isUpdating = false;
    const desc = error.description || error.message || '';
    
    if (desc.includes('not modified')) return true;
    if (desc.includes('not found') || desc.includes('message to edit not found')) {
      console.log('[Bot] Message deleted, reinitializing...');
      state.messageId = null;
      return false;
    }
    if (desc.includes('Too Many')) {
      console.log('[Bot] Rate limited, waiting...');
      return true;
    }
    console.error('[Bot] Update error:', desc);
    return true;
  }
}

// Первичная отправка
async function sendInitialMessage() {
  try {
    const { current, upcoming } = await getEventsData();
    const imageBuffer = await generateRaidImage(current, upcoming);
    const caption = generateCaption(current, upcoming);
    
    const result = await bot.telegram.sendPhoto(
      config.CHAT_ID, 
      { source: imageBuffer },
      { caption, parse_mode: 'HTML' }
    );
    
    console.log('[Bot] Photo sent:', result.message_id);
    
    // Закрепляем
    try {
      await bot.telegram.pinChatMessage(config.CHAT_ID, result.message_id, {
        disable_notification: true
      });
      console.log('[Bot] Pinned');
    } catch (e) {
      console.error('[Bot] Pin error:', e.message);
    }
    
    return result.message_id;
  } catch (error) {
    console.error('[Bot] Send error:', error.message);
    return null;
  }
}

// Цикл обновления
async function loop() {
  if (!state.messageId) {
    state.messageId = await sendInitialMessage();
    return;
  }
  
  const ok = await updateMessage();
  state.updateCount++;
  
  if (state.updateCount % 12 === 0) {
    console.log(`[Bot] ✓ ${state.updateCount} updates, msg: ${state.messageId}`);
  }
}

async function main() {
  console.log('🤖 ARC Raiders Bot v2');
  
  await fetchEvents(true);
  console.log('✅ API OK');
  
  bot.launch().then(() => console.log('✅ Polling started'));
  console.log('✅ Bot started');
  
  // Первый запуск
  state.messageId = await sendInitialMessage();
  
  // Обновление каждые N секунд
  setInterval(loop, config.UPDATE_INTERVAL * 1000);
  console.log(`✅ Update interval: ${config.UPDATE_INTERVAL}s`);
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

main().catch(console.error);
