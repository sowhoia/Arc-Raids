const { createCanvas } = require('@napi-rs/canvas');
const sharp = require('sharp');
const config = require('./config');

const W = 1080;
const PAD = 40;
const GAP = 14;
const R = 20;

const FONT = 'DejaVu Sans, Liberation Sans, sans-serif';

const C = {
  bg: '#0b0b0f',
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.06)',
  white: '#f0f0f0',
  subtext: '#8b8b9e',
  dim: '#505068',
  green: '#34d399',
  greenDim: 'rgba(52,211,153,0.12)',
  red: '#f87171',
  redDim: 'rgba(248,113,113,0.12)',
  orange: '#fbbf24',
  orangeDim: 'rgba(251,191,36,0.10)',
  blue: '#60a5fa',
  purple: '#c084fc',
  cyan: '#22d3ee',
  pink: '#f472b6',
  yellow: '#facc15',
};

const MAP_COLORS = {
  'Dam': C.blue,
  'Stella Montis': C.purple,
  'Blue Gate': C.cyan,
  'Spaceport': C.orange,
  'Buried City': C.pink,
};

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

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function fmt(ms) {
  if (ms <= 0) return '00:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}ч ${String(m).padStart(2, '0')}м`;
  if (m > 0) return `${m}м ${String(sec).padStart(2, '0')}с`;
  return `${sec}с`;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawGlowCard(ctx, x, y, w, h, accentColor) {
  // Subtle glow behind card
  ctx.save();
  ctx.shadowColor = hexToRgba(accentColor, 0.15);
  ctx.shadowBlur = 30;
  ctx.fillStyle = 'rgba(0,0,0,0)';
  rr(ctx, x, y, w, h, R);
  ctx.fill();
  ctx.restore();

  // Card background
  ctx.fillStyle = C.card;
  rr(ctx, x, y, w, h, R);
  ctx.fill();

  // Card border
  ctx.strokeStyle = C.cardBorder;
  ctx.lineWidth = 1;
  rr(ctx, x, y, w, h, R);
  ctx.stroke();
}

async function generateRaidImage(current, upcoming) {
  const activeCols = 2;
  const upcomingCols = 3;

  const activeCardW = (W - PAD * 2 - GAP) / activeCols;
  const activeCardH = 170;
  const upCardW = (W - PAD * 2 - GAP * (upcomingCols - 1)) / upcomingCols;
  const upCardH = 110;

  const activeCount = Math.min(current.length, 6);
  const upCount = Math.min(upcoming.length, 9);
  const activeRows = Math.ceil(activeCount / activeCols);
  const upRows = Math.ceil(upCount / upcomingCols);

  const headerH = 90;
  const sectionGap = 36;
  const labelH = 44;
  const footerH = 50;

  const activeSection = activeRows > 0 ? labelH + activeRows * activeCardH + (activeRows - 1) * GAP : 0;
  const upSection = upRows > 0 ? labelH + upRows * upCardH + (upRows - 1) * GAP : 0;
  const betweenSections = (activeSection > 0 && upSection > 0) ? sectionGap : 0;

  const H = PAD + headerH + activeSection + betweenSections + upSection + footerH + PAD;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#0e0e14');
  bgGrad.addColorStop(0.5, '#0b0b0f');
  bgGrad.addColorStop(1, '#08080c');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Decorative top glow
  const topGlow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, W * 0.6);
  topGlow.addColorStop(0, 'rgba(96,165,250,0.06)');
  topGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, W, H * 0.4);

  // Subtle grid pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.015)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 60) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, H);
    ctx.stroke();
  }
  for (let gy = 0; gy < H; gy += 60) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
  }

  let y = PAD;

  // ── Header ──
  ctx.textAlign = 'center';
  ctx.fillStyle = C.white;
  ctx.font = `bold 38px ${FONT}`;
  ctx.fillText('ARC RAIDERS', W / 2, y + 38);

  // Thin separator line
  const lineW = 180;
  const lineGrad = ctx.createLinearGradient(W / 2 - lineW / 2, 0, W / 2 + lineW / 2, 0);
  lineGrad.addColorStop(0, 'rgba(255,255,255,0)');
  lineGrad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
  lineGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = lineGrad;
  ctx.fillRect(W / 2 - lineW / 2, y + 50, lineW, 1);

  ctx.fillStyle = C.dim;
  ctx.font = `600 13px ${FONT}`;
  ctx.letterSpacing = '4px';
  ctx.fillText('RAID  TRACKER', W / 2, y + 72);
  ctx.letterSpacing = '0px';

  y += headerH;

  // ── Active section ──
  if (activeCount > 0) {
    // Section label
    ctx.textAlign = 'left';
    ctx.fillStyle = C.green;
    ctx.font = `bold 15px ${FONT}`;
    ctx.fillText('● АКТИВНЫЕ РЕЙДЫ', PAD, y + 24);

    // Count badge
    ctx.fillStyle = C.greenDim;
    const countText = `${activeCount}`;
    ctx.font = `bold 12px ${FONT}`;
    const countW = ctx.measureText(countText).width + 16;
    rr(ctx, PAD + ctx.measureText('● АКТИВНЫЕ РЕЙДЫ').width + 12, y + 11, countW, 20, 10);
    ctx.fill();
    ctx.fillStyle = C.green;
    ctx.fillText(countText, PAD + ctx.measureText('● АКТИВНЫЕ РЕЙДЫ').width + 12 + 8, y + 25);

    y += labelH;

    for (let i = 0; i < activeCount; i++) {
      const e = current[i];
      const col = i % activeCols;
      const row = Math.floor(i / activeCols);
      const cx = PAD + col * (activeCardW + GAP);
      const cy = y + row * (activeCardH + GAP);
      const mapColor = MAP_COLORS[e.map] || C.blue;
      const timeLeft = Math.max(0, e.endTime - Date.now());
      const isLow = timeLeft < 300000;
      const icon = EVENT_ICONS[e.name] || '⚔️';

      drawGlowCard(ctx, cx, cy, activeCardW, activeCardH, mapColor);

      // Top accent gradient
      const accentGrad = ctx.createLinearGradient(cx, cy, cx + activeCardW, cy);
      accentGrad.addColorStop(0, hexToRgba(mapColor, 0.6));
      accentGrad.addColorStop(1, hexToRgba(mapColor, 0));
      ctx.fillStyle = accentGrad;
      rr(ctx, cx, cy, activeCardW, 3, [R, R, 0, 0]);
      ctx.fill();

      const ip = 22;

      // Map name
      ctx.textAlign = 'left';
      ctx.fillStyle = mapColor;
      ctx.font = `bold 12px ${FONT}`;
      const mapName = config.MAP_NAMES_RU[e.map] || e.map;
      ctx.fillText(mapName.toUpperCase(), cx + ip, cy + 28);

      // LIVE badge with pulse-style
      const badgeW = 54;
      const badgeH = 22;
      const badgeX = cx + activeCardW - ip - badgeW;
      const badgeY = cy + 14;
      ctx.fillStyle = isLow ? C.redDim : 'rgba(239,68,68,0.15)';
      rr(ctx, badgeX, badgeY, badgeW, badgeH, 11);
      ctx.fill();
      ctx.fillStyle = isLow ? C.red : '#ef4444';
      ctx.font = `bold 10px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('● LIVE', badgeX + badgeW / 2, badgeY + 15);

      // Event name with icon
      ctx.textAlign = 'left';
      ctx.fillStyle = C.white;
      const eventName = config.EVENT_NAMES_RU[e.name] || e.name;
      let fontSize = 24;
      ctx.font = `bold ${fontSize}px ${FONT}`;
      const fullName = `${icon} ${eventName}`;
      while (ctx.measureText(fullName).width > activeCardW - ip * 2 && fontSize > 16) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px ${FONT}`;
      }
      ctx.fillText(fullName, cx + ip, cy + 68);

      // Progress bar
      const barW = activeCardW - ip * 2;
      const barH = 5;
      const barY = cy + 92;

      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      rr(ctx, cx + ip, barY, barW, barH, 3);
      ctx.fill();

      const total = e.endTime - e.startTime;
      const elapsed = Date.now() - e.startTime;
      const pct = 1 - Math.min(1, elapsed / total);

      const barGrad = ctx.createLinearGradient(cx + ip, 0, cx + ip + barW * pct, 0);
      barGrad.addColorStop(0, isLow ? C.red : C.green);
      barGrad.addColorStop(1, isLow ? hexToRgba(C.red, 0.4) : hexToRgba(C.green, 0.4));
      ctx.fillStyle = barGrad;
      rr(ctx, cx + ip, barY, Math.max(5, barW * pct), barH, 3);
      ctx.fill();

      // Timer — big, monospaced feel
      ctx.textAlign = 'left';
      ctx.fillStyle = C.dim;
      ctx.font = `500 13px ${FONT}`;
      ctx.fillText('Осталось', cx + ip, cy + activeCardH - 24);

      ctx.textAlign = 'right';
      ctx.fillStyle = isLow ? C.red : C.white;
      ctx.font = `bold 28px ${FONT}`;
      ctx.fillText(fmt(timeLeft), cx + activeCardW - ip, cy + activeCardH - 18);
    }

    y += activeRows * activeCardH + (activeRows - 1) * GAP + sectionGap;
  }

  // ── Upcoming section ──
  if (upCount > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = C.orange;
    ctx.font = `bold 15px ${FONT}`;
    ctx.fillText('○ ПРЕДСТОЯЩИЕ', PAD, y + 24);
    y += labelH;

    for (let i = 0; i < upCount; i++) {
      const e = upcoming[i];
      const col = i % upcomingCols;
      const row = Math.floor(i / upcomingCols);
      const cx = PAD + col * (upCardW + GAP);
      const cy = y + row * (upCardH + GAP);
      const mapColor = MAP_COLORS[e.map] || C.blue;
      const timeUntil = Math.max(0, e.startTime - Date.now());
      const isSoon = timeUntil < 600000;
      const icon = EVENT_ICONS[e.name] || '⚔️';

      // Card
      ctx.fillStyle = C.card;
      rr(ctx, cx, cy, upCardW, upCardH, R);
      ctx.fill();
      ctx.strokeStyle = C.cardBorder;
      ctx.lineWidth = 1;
      rr(ctx, cx, cy, upCardW, upCardH, R);
      ctx.stroke();

      // Left accent
      const accentH = 40;
      ctx.fillStyle = hexToRgba(mapColor, 0.5);
      rr(ctx, cx, cy + (upCardH - accentH) / 2, 3, accentH, 2);
      ctx.fill();

      const ip = 16;

      // Map
      ctx.textAlign = 'left';
      ctx.fillStyle = hexToRgba(mapColor, 0.8);
      ctx.font = `bold 11px ${FONT}`;
      const mapName = config.MAP_NAMES_RU[e.map] || e.map;
      ctx.fillText(mapName.toUpperCase(), cx + ip, cy + 24);

      // Event name
      ctx.fillStyle = C.white;
      const eventName = config.EVENT_NAMES_RU[e.name] || e.name;
      let fontSize = 15;
      ctx.font = `600 ${fontSize}px ${FONT}`;
      const dispName = `${icon} ${eventName}`;
      while (ctx.measureText(dispName).width > upCardW - ip * 2 && fontSize > 11) {
        fontSize -= 1;
        ctx.font = `600 ${fontSize}px ${FONT}`;
      }
      ctx.fillText(dispName, cx + ip, cy + 50);

      // Timer
      ctx.fillStyle = isSoon ? C.green : C.subtext;
      ctx.font = `bold 20px ${FONT}`;
      ctx.fillText(fmt(timeUntil), cx + ip, cy + upCardH - 18);

      // "Soon" indicator
      if (isSoon) {
        ctx.fillStyle = C.greenDim;
        const soonText = 'СКОРО';
        ctx.font = `bold 9px ${FONT}`;
        const sw = ctx.measureText(soonText).width + 10;
        rr(ctx, cx + upCardW - ip - sw, cy + upCardH - 30, sw, 18, 9);
        ctx.fill();
        ctx.fillStyle = C.green;
        ctx.fillText(soonText, cx + upCardW - ip - sw + 5, cy + upCardH - 18);
      }
    }
  }

  // ── Footer ──
  ctx.textAlign = 'center';
  ctx.fillStyle = C.dim;
  ctx.font = `12px ${FONT}`;
  const time = new Date().toLocaleTimeString('ru-RU', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  ctx.fillText(`Обновлено ${time} МСК  ·  metaforge.app`, W / 2, H - PAD + 10);

  // Optimize with sharp — convert to high-quality JPEG for smaller size
  const pngBuffer = canvas.toBuffer('image/png');
  const optimized = await sharp(pngBuffer)
    .png({ compressionLevel: 6, palette: false })
    .toBuffer();

  return optimized;
}

module.exports = { generateRaidImage };

