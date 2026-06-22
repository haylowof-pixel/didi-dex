/**
 * TradeMind Server — Bot de trading Binance réel
 * Lance avec : node server.js
 * Dashboard : http://localhost:3000 (ou http://<IP-PC>:3000 depuis ton téléphone)
 */

const express  = require('express');
const cors     = require('cors');
const http     = require('http');
const WebSocket = require('ws');
const crypto   = require('crypto');
const fetch    = require('node-fetch');
const path     = require('path');
const fs       = require('fs');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });
const PORT   = process.env.PORT || 3000;

// ─── Config persistence ──────────────────────────────────────────────────────
const CONFIG_FILE = path.join(__dirname, '.trademind-config.json');
let config = {
  apiKey: '',
  apiSecret: '',
  mode: 'sim',         // 'sim' | 'live'
  startBalance: 100,
  tradePercent: 10,
  stopLoss: 3,
  takeProfit: 6,
  strategy: 'rsi_macd',
  coins: ['BTC', 'ETH'],
};

function saveConfig() {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      Object.assign(config, JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')));
    }
  } catch {}
}
loadConfig();

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  simBalance: config.startBalance,
  realBalances: {},      // { BTC: '0.001', USDT: '25', EUR: '50', ... }
  prices: {},            // { BTC: 95000, ETH: 3500, ... }
  priceHistory: {},      // { BTC: [95000, 95100, ...], ... }
  openPositions: {},     // { BTC: { entry, qty, amount, side, time } }
  trades: [],            // closed trades
  botRunning: false,
  wins: 0,
  totalPnl: 0,
  botInterval: null,
  priceInterval: null,
};

// ─── Binance API helpers ──────────────────────────────────────────────────────
const BINANCE_BASE = 'https://api.binance.com';

function sign(params, secret) {
  const query = new URLSearchParams(params).toString();
  return crypto.createHmac('sha256', secret).update(query).digest('hex');
}

async function binancePublic(endpoint, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${BINANCE_BASE}${endpoint}${qs ? '?' + qs : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance ${res.status}: ${await res.text()}`);
  return res.json();
}

async function binanceSigned(method, endpoint, params = {}) {
  if (!config.apiKey || !config.apiSecret) throw new Error('Clés API manquantes');
  params.timestamp = Date.now();
  params.recvWindow = 5000;
  const signature = sign(params, config.apiSecret);
  params.signature = signature;
  const qs = new URLSearchParams(params).toString();
  const url = `${BINANCE_BASE}${endpoint}${method === 'GET' ? '?' + qs : ''}`;
  const res = await fetch(url, {
    method,
    headers: { 'X-MBX-APIKEY': config.apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: method !== 'GET' ? qs : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || `Binance error ${res.status}`);
  return data;
}

// ─── Price fetching ───────────────────────────────────────────────────────────
const SYMBOL_MAP = {
  BTC: 'BTCEUR', ETH: 'ETHEUR', SOL: 'SOLEUR',
  BNB: 'BNBEUR', XRP: 'XRPEUR', ADA: 'ADAEUR',
};

async function fetchPrices() {
  try {
    const symbols = config.coins.map(c => SYMBOL_MAP[c]).filter(Boolean);
    const allSymbols = Object.values(SYMBOL_MAP);
    const data = await binancePublic('/api/v3/ticker/24hr', {
      symbols: JSON.stringify(allSymbols),
    });
    data.forEach(t => {
      const coin = Object.keys(SYMBOL_MAP).find(k => SYMBOL_MAP[k] === t.symbol);
      if (!coin) return;
      const price = parseFloat(t.lastPrice);
      state.prices[coin] = price;
      if (!state.priceHistory[coin]) state.priceHistory[coin] = [];
      state.priceHistory[coin].push(price);
      if (state.priceHistory[coin].length > 60) state.priceHistory[coin].shift();
    });
    broadcast({ type: 'prices', data: state.prices, history: state.priceHistory });
  } catch (e) {
    console.error('[prices]', e.message);
    // Fallback : simuler légère variation si déjà des prix
    Object.keys(state.prices).forEach(coin => {
      const delta = state.prices[coin] * (Math.random() - 0.498) * 0.003;
      state.prices[coin] = Math.max(0.001, state.prices[coin] + delta);
      if (!state.priceHistory[coin]) state.priceHistory[coin] = [];
      state.priceHistory[coin].push(state.prices[coin]);
      if (state.priceHistory[coin].length > 60) state.priceHistory[coin].shift();
    });
    broadcast({ type: 'prices', data: state.prices, history: state.priceHistory });
  }
}

async function fetchRealBalances() {
  if (config.mode !== 'live' || !config.apiKey) return;
  try {
    const account = await binanceSigned('GET', '/api/v3/account');
    state.realBalances = {};
    account.balances.forEach(b => {
      const free = parseFloat(b.free);
      if (free > 0) state.realBalances[b.asset] = free;
    });
    broadcast({ type: 'balances', data: state.realBalances });
  } catch (e) {
    broadcast({ type: 'error', msg: 'Balance: ' + e.message });
  }
}

// ─── Technical indicators ─────────────────────────────────────────────────────
function calcRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const rs = (gains / period) / ((losses / period) || 0.001);
  return 100 - 100 / (1 + rs);
}

function calcEMA(prices, period) {
  const k = 2 / (period + 1);
  return prices.reduce((ema, p, i) => i === 0 ? p : p * k + ema * (1 - k), prices[0] || 0);
}

function calcMACD(prices) {
  if (prices.length < 26) return { hist: 0 };
  const ema12 = calcEMA(prices, 12);
  const ema26 = calcEMA(prices, 26);
  const macd = ema12 - ema26;
  const recent9 = prices.slice(-9).map((_, i) => {
    const sl = prices.slice(0, prices.length - 9 + i + 1);
    return calcEMA(sl, 12) - calcEMA(sl, 26);
  });
  const signal = calcEMA(recent9, 9);
  return { macd, signal, hist: macd - signal };
}

function computeSignal(coin) {
  const h = state.priceHistory[coin] || [];
  const price = state.prices[coin] || 0;
  if (h.length < 5) return { signal: 'WATCH', rsi: 50, score: 0, price, ma20: price };

  const rsi = calcRSI(h);
  const { hist } = calcMACD(h);
  const ma20 = h.length >= 20 ? h.slice(-20).reduce((a, b) => a + b, 0) / 20 : h.reduce((a, b) => a + b, 0) / h.length;

  let score = 0;
  if (rsi < 35) score += 2; else if (rsi < 45) score += 1;
  else if (rsi > 65) score -= 2; else if (rsi > 55) score -= 1;
  if (hist > 0) score += 1; else score -= 1;
  if (price > ma20) score += 1; else score -= 1;

  const signal = score >= 3 ? 'BUY' : score <= -3 ? 'SELL' : score >= 1 ? 'WATCH' : 'HOLD';
  return { signal, rsi, macd: hist, score, price, ma20 };
}

// ─── Real order execution ─────────────────────────────────────────────────────
async function placeRealOrder(coin, side, eurAmount) {
  const symbol = SYMBOL_MAP[coin];
  if (!symbol) throw new Error('Paire inconnue: ' + coin);
  const price = state.prices[coin];
  if (!price) throw new Error('Prix indisponible pour ' + coin);

  // Calcule la quantité
  const qty = eurAmount / price;

  // Récupère les infos de la paire pour arrondir correctement
  const info = await binancePublic('/api/v3/exchangeInfo', { symbol });
  const lotFilter = info.symbols[0].filters.find(f => f.filterType === 'LOT_SIZE');
  const minQty = parseFloat(lotFilter?.minQty || '0.00001');
  const stepSize = parseFloat(lotFilter?.stepSize || '0.00001');
  const decimals = stepSize.toString().split('.')[1]?.length || 5;
  const roundedQty = (Math.floor(qty / stepSize) * stepSize).toFixed(decimals);

  if (parseFloat(roundedQty) < minQty) {
    throw new Error(`Montant trop faible. Min requis ≈ €${(minQty * price).toFixed(2)}`);
  }

  const order = await binanceSigned('POST', '/api/v3/order', {
    symbol,
    side,
    type: 'MARKET',
    quantity: roundedQty,
  });
  return { ...order, qty: parseFloat(roundedQty), price };
}

// ─── Bot logic ────────────────────────────────────────────────────────────────
async function botTick() {
  const isLive = config.mode === 'live';
  const tradePercent = config.tradePercent / 100;
  const slPct = config.stopLoss / 100;
  const tpPct = config.takeProfit / 100;

  for (const coin of config.coins) {
    const sig = computeSignal(coin);
    const price = state.prices[coin];
    if (!price) continue;

    const pos = state.openPositions[coin];

    // ── Gestion des positions ouvertes ──
    if (pos) {
      const pnlPct = (price - pos.entry) / pos.entry;
      const hit = pnlPct <= -slPct ? 'Stop-Loss' : pnlPct >= tpPct ? 'Take-Profit' : null;
      if (hit) {
        try {
          if (isLive) await placeRealOrder(coin, 'SELL', pos.qty * price);
          const pnl = (price - pos.entry) * pos.qty;
          state.totalPnl += pnl;
          if (pnl > 0) state.wins++;
          if (!isLive) state.simBalance += pos.amount + pnl;
          state.trades.push({
            coin, side: 'BUY→SELL', entry: pos.entry, exit: price,
            qty: pos.qty, pnl, amount: pos.amount, reason: hit,
            mode: isLive ? 'RÉEL' : 'SIM',
            time: new Date().toISOString(),
          });
          delete state.openPositions[coin];
          const icon = pnl >= 0 ? '🟢' : '🔴';
          broadcast({ type: 'log', level: pnl >= 0 ? 'win' : 'loss', msg: `${icon} FERMETURE ${coin} (${hit}) · PnL: ${pnl >= 0 ? '+' : ''}€${pnl.toFixed(2)}` });
          broadcast({ type: 'trade_closed', trade: state.trades[state.trades.length - 1] });
          if (isLive) await fetchRealBalances();
        } catch (e) {
          broadcast({ type: 'error', msg: `Fermeture ${coin}: ${e.message}` });
        }
      }
      continue;
    }

    // ── Ouverture sur signal BUY ──
    if (sig.signal === 'BUY') {
      try {
        let amount, qty;
        if (isLive) {
          const eurBalance = state.realBalances['EUR'] || state.realBalances['USDT'] || 0;
          amount = eurBalance * tradePercent;
          if (amount < 2) { broadcast({ type: 'log', level: 'warn', msg: `⚠️ Balance EUR insuffisante (${eurBalance.toFixed(2)})` }); continue; }
          const order = await placeRealOrder(coin, 'BUY', amount);
          qty = order.qty;
          amount = qty * price;
          await fetchRealBalances();
        } else {
          amount = state.simBalance * tradePercent;
          if (amount < 0.5) continue;
          qty = amount / price;
          state.simBalance -= amount;
        }
        state.openPositions[coin] = { entry: price, qty, amount, time: Date.now() };
        broadcast({ type: 'log', level: 'buy', msg: `🟢 ACHAT ${coin} @ €${price.toFixed(2)} · Montant: €${amount.toFixed(2)} · Mode: ${isLive ? 'RÉEL' : 'SIM'}` });
        broadcast({ type: 'position_opened', coin, position: state.openPositions[coin] });
      } catch (e) {
        broadcast({ type: 'error', msg: `Achat ${coin}: ${e.message}` });
      }
    }
  }

  broadcastState();
}

function broadcastState() {
  broadcast({
    type: 'state',
    simBalance: state.simBalance,
    realBalances: state.realBalances,
    openPositions: state.openPositions,
    totalPnl: state.totalPnl,
    wins: state.wins,
    totalTrades: state.trades.length,
    botRunning: state.botRunning,
    mode: config.mode,
    signals: Object.fromEntries(config.coins.map(c => [c, computeSignal(c)])),
  });
}

// ─── WebSocket broadcast ──────────────────────────────────────────────────────
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

// ─── REST API ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Statut
app.get('/api/status', (_, res) => {
  res.json({ ok: true, mode: config.mode, botRunning: state.botRunning, version: '1.0.0' });
});

// Config GET/POST
app.get('/api/config', (_, res) => {
  res.json({ ...config, apiSecret: config.apiSecret ? '••••••••' : '' });
});

app.post('/api/config', (req, res) => {
  const { apiKey, apiSecret, mode, startBalance, tradePercent, stopLoss, takeProfit, strategy, coins } = req.body;
  if (apiKey !== undefined) config.apiKey = apiKey;
  if (apiSecret !== undefined && apiSecret !== '••••••••') config.apiSecret = apiSecret;
  if (mode !== undefined) config.mode = mode;
  if (startBalance !== undefined) { config.startBalance = parseFloat(startBalance); state.simBalance = config.startBalance; }
  if (tradePercent !== undefined) config.tradePercent = parseFloat(tradePercent);
  if (stopLoss !== undefined) config.stopLoss = parseFloat(stopLoss);
  if (takeProfit !== undefined) config.takeProfit = parseFloat(takeProfit);
  if (strategy !== undefined) config.strategy = strategy;
  if (coins !== undefined) config.coins = coins;
  saveConfig();
  res.json({ ok: true });
});

// Test connexion Binance
app.post('/api/test-connection', async (req, res) => {
  try {
    const account = await binanceSigned('GET', '/api/v3/account');
    const balances = account.balances
      .filter(b => parseFloat(b.free) > 0)
      .reduce((acc, b) => { acc[b.asset] = parseFloat(b.free); return acc; }, {});
    state.realBalances = balances;
    res.json({ ok: true, balances, permissions: account.permissions });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// Démarrer/stopper le bot
app.post('/api/bot/start', (_, res) => {
  if (state.botRunning) return res.json({ ok: true, msg: 'Déjà en cours' });
  state.botRunning = true;
  state.botInterval = setInterval(botTick, 15000);
  botTick();
  broadcast({ type: 'log', level: 'info', msg: `🤖 Bot démarré en mode ${config.mode.toUpperCase()} · Stratégie: ${config.strategy}` });
  res.json({ ok: true });
});

app.post('/api/bot/stop', (_, res) => {
  state.botRunning = false;
  clearInterval(state.botInterval);
  broadcast({ type: 'log', level: 'info', msg: '⏹ Bot arrêté' });
  res.json({ ok: true });
});

// Réinitialiser
app.post('/api/bot/reset', (_, res) => {
  state.botRunning = false;
  clearInterval(state.botInterval);
  state.simBalance = config.startBalance;
  state.trades = [];
  state.openPositions = {};
  state.totalPnl = 0;
  state.wins = 0;
  broadcast({ type: 'log', level: 'info', msg: '↺ Bot réinitialisé' });
  broadcastState();
  res.json({ ok: true });
});

// Historique des trades
app.get('/api/trades', (_, res) => res.json(state.trades));

// Clôture manuelle d'une position
app.post('/api/close/:coin', async (req, res) => {
  const { coin } = req.params;
  const pos = state.openPositions[coin];
  if (!pos) return res.status(404).json({ error: 'Position introuvable' });
  try {
    const price = state.prices[coin];
    if (config.mode === 'live') await placeRealOrder(coin, 'SELL', pos.qty * price);
    const pnl = (price - pos.entry) * pos.qty;
    state.totalPnl += pnl;
    if (pnl > 0) state.wins++;
    if (config.mode === 'sim') state.simBalance += pos.amount + pnl;
    state.trades.push({ coin, side: 'BUY→SELL', entry: pos.entry, exit: price, qty: pos.qty, pnl, amount: pos.amount, reason: 'Manuel', mode: config.mode === 'live' ? 'RÉEL' : 'SIM', time: new Date().toISOString() });
    delete state.openPositions[coin];
    if (config.mode === 'live') await fetchRealBalances();
    broadcastState();
    res.json({ ok: true, pnl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── WebSocket handshake ──────────────────────────────────────────────────────
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connected', mode: config.mode, botRunning: state.botRunning }));
  broadcastState();
  ws.send(JSON.stringify({ type: 'trades', data: state.trades }));
});

// ─── Price polling ────────────────────────────────────────────────────────────
async function startPricePolling() {
  await fetchPrices();
  await fetchRealBalances();
  state.priceInterval = setInterval(async () => {
    await fetchPrices();
    await fetchRealBalances();
    if (state.botRunning) broadcastState();
  }, 10000);
}

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', async () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║         TradeMind Bot Server           ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  Dashboard PC   : http://localhost:${PORT}  ║`);
  console.log(`║  Dashboard Mobile: http://<IP-PC>:${PORT}  ║`);
  console.log(`║  Mode actuel    : ${config.mode.toUpperCase().padEnd(18)} ║`);
  console.log('╚════════════════════════════════════════╝\n');

  // Affiche l'IP locale pour accès mobile
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  Object.values(nets).flat().filter(n => n.family === 'IPv4' && !n.internal).forEach(n => {
    console.log(`  → Depuis ton téléphone : http://${n.address}:${PORT}`);
  });
  console.log('');

  await startPricePolling();
});
