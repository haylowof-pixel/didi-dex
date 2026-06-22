/**
 * TradeMind Server — Multi-Exchange Trading Bot
 * Exchanges supportés : Kraken (recommandé Europe), Bybit, KuCoin, Binance
 * Lance avec : node server.js
 */

const express   = require('express');
const cors      = require('cors');
const http      = require('http');
const WebSocket = require('ws');
const crypto    = require('crypto');
const fetch     = require('node-fetch');
const path      = require('path');
const fs        = require('fs');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });
const PORT   = process.env.PORT || 3000;

// ─── Config ───────────────────────────────────────────────────────────────────
const CONFIG_FILE = path.join(__dirname, '.trademind-config.json');
let config = {
  exchange:     'kraken',  // 'kraken' | 'bybit' | 'kucoin' | 'binance'
  apiKey:       '',
  apiSecret:    '',
  apiPassphrase: '',       // KuCoin uniquement
  mode:         'sim',
  startBalance: 100,
  tradePercent: 10,
  stopLoss:     3,
  takeProfit:   6,
  strategy:     'rsi_macd',
  coins:        ['BTC', 'ETH'],
  currency:     'EUR',     // EUR ou USDT selon exchange
};

function saveConfig() { try { fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2)); } catch {} }
function loadConfig() { try { if (fs.existsSync(CONFIG_FILE)) Object.assign(config, JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))); } catch {} }
loadConfig();

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  simBalance:    config.startBalance,
  realBalances:  {},
  prices:        {},
  priceHistory:  {},
  openPositions: {},
  trades:        [],
  botRunning:    false,
  wins:          0,
  totalPnl:      0,
  botInterval:   null,
};

// ════════════════════════════════════════════════════════════════════════════════
//  EXCHANGE ADAPTERS
// ════════════════════════════════════════════════════════════════════════════════

// ─── Kraken ───────────────────────────────────────────────────────────────────
// Paires EUR disponibles — montant min ~10€ — régulé Europe
const KRAKEN_BASE = 'https://api.kraken.com';
const KRAKEN_PAIRS = { BTC:'XXBTZEUR', ETH:'XETHZEUR', SOL:'SOLEUR', BNB:'BNBEUR', XRP:'XXRPZEUR', ADA:'ADAEUR' };
const KRAKEN_ASSETS = { BTC:'XXBT', ETH:'XETH', SOL:'SOL', BNB:'BNB', XRP:'XXRP', ADA:'ADA' };

async function krakenPublic(path_, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${KRAKEN_BASE}/0/public${path_}${qs ? '?' + qs : ''}`);
  const d = await r.json();
  if (d.error?.length) throw new Error(d.error[0]);
  return d.result;
}

async function krakenPrivate(method, params = {}) {
  const nonce = Date.now().toString();
  params.nonce = nonce;
  const body = new URLSearchParams(params).toString();
  const hash = crypto.createHash('sha256').update(nonce + body).digest();
  const secret = Buffer.from(config.apiSecret, 'base64');
  const sig = crypto.createHmac('sha512', secret).update(method + hash).digest('base64');
  const r = await fetch(`${KRAKEN_BASE}/0/private${method}`, {
    method: 'POST',
    headers: { 'API-Key': config.apiKey, 'API-Sign': sig, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const d = await r.json();
  if (d.error?.length) throw new Error(d.error[0]);
  return d.result;
}

async function krakenGetPrices() {
  const pairs = config.coins.map(c => KRAKEN_PAIRS[c]).filter(Boolean);
  const data = await krakenPublic('/Ticker', { pair: pairs.join(',') });
  const result = {};
  Object.entries(data).forEach(([pair, v]) => {
    const coin = Object.keys(KRAKEN_PAIRS).find(k => KRAKEN_PAIRS[k] === pair || pair.includes(k));
    if (coin) result[coin] = parseFloat(v.c[0]);
  });
  return result;
}

async function krakenGetBalances() {
  const data = await krakenPrivate('/Balance');
  const out = {};
  Object.entries(data).forEach(([asset, val]) => {
    const v = parseFloat(val);
    if (v > 0) {
      // Normalise les noms (XXBT→BTC, ZEUR→EUR...)
      const name = asset.replace(/^[XZ]/, '') || asset;
      out[name === 'XBT' ? 'BTC' : name] = v;
    }
  });
  return out;
}

async function krakenPlaceOrder(coin, side, qty) {
  const pair = KRAKEN_PAIRS[coin];
  if (!pair) throw new Error('Paire Kraken inconnue: ' + coin);
  return krakenPrivate('/AddOrder', { pair, type: side.toLowerCase(), ordertype: 'market', volume: qty.toString() });
}

// ─── Bybit ────────────────────────────────────────────────────────────────────
// Paires USDT — frais ultra faibles — très bonne liquidité
const BYBIT_BASE = 'https://api.bybit.com';
const BYBIT_PAIRS = { BTC:'BTCUSDT', ETH:'ETHUSDT', SOL:'SOLUSDT', BNB:'BNBUSDT', XRP:'XRPUSDT', ADA:'ADAUSDT' };

async function bybitPublic(path_, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${BYBIT_BASE}${path_}${qs ? '?' + qs : ''}`);
  const d = await r.json();
  if (d.retCode !== 0) throw new Error(d.retMsg);
  return d.result;
}

async function bybitSigned(method, path_, params = {}) {
  const ts = Date.now().toString();
  const recv = '5000';
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  const raw = ts + config.apiKey + recv + (method === 'GET' ? sorted : JSON.stringify(params));
  const sig = crypto.createHmac('sha256', config.apiSecret).update(raw).digest('hex');
  const headers = { 'X-BAPI-API-KEY': config.apiKey, 'X-BAPI-TIMESTAMP': ts, 'X-BAPI-SIGN': sig, 'X-BAPI-RECV-WINDOW': recv };
  if (method === 'GET') {
    const r = await fetch(`${BYBIT_BASE}${path_}?${sorted}`, { headers });
    const d = await r.json();
    if (d.retCode !== 0) throw new Error(d.retMsg);
    return d.result;
  }
  headers['Content-Type'] = 'application/json';
  const r = await fetch(`${BYBIT_BASE}${path_}`, { method: 'POST', headers, body: JSON.stringify(params) });
  const d = await r.json();
  if (d.retCode !== 0) throw new Error(d.retMsg);
  return d.result;
}

async function bybitGetPrices() {
  const result = {};
  for (const coin of config.coins) {
    const sym = BYBIT_PAIRS[coin];
    if (!sym) continue;
    const d = await bybitPublic('/v5/market/tickers', { category: 'spot', symbol: sym });
    if (d.list?.[0]) result[coin] = parseFloat(d.list[0].lastPrice);
  }
  return result;
}

async function bybitGetBalances() {
  const d = await bybitSigned('GET', '/v5/account/wallet-balance', { accountType: 'UNIFIED' });
  const out = {};
  d.list?.[0]?.coin?.forEach(c => { const v = parseFloat(c.walletBalance); if (v > 0) out[c.coin] = v; });
  return out;
}

async function bybitPlaceOrder(coin, side, qty) {
  const sym = BYBIT_PAIRS[coin];
  return bybitSigned('POST', '/v5/order/create', { category: 'spot', symbol: sym, side: side === 'BUY' ? 'Buy' : 'Sell', orderType: 'Market', qty: qty.toString() });
}

// ─── KuCoin ───────────────────────────────────────────────────────────────────
// Montants minimum très faibles — beaucoup d'altcoins
const KUCOIN_BASE = 'https://api.kucoin.com';
const KUCOIN_PAIRS = { BTC:'BTC-USDT', ETH:'ETH-USDT', SOL:'SOL-USDT', BNB:'BNB-USDT', XRP:'XRP-USDT', ADA:'ADA-USDT' };

async function kucoinPublic(path_, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${KUCOIN_BASE}${path_}${qs ? '?' + qs : ''}`);
  const d = await r.json();
  if (d.code !== '200000') throw new Error(d.msg);
  return d.data;
}

async function kucoinSigned(method, path_, body = {}) {
  const ts = Date.now().toString();
  const bodyStr = method === 'GET' ? '' : JSON.stringify(body);
  const pre = ts + method + path_ + bodyStr;
  const sig = crypto.createHmac('sha256', config.apiSecret).update(pre).digest('base64');
  const pass = crypto.createHmac('sha256', config.apiSecret).update(config.apiPassphrase).digest('base64');
  const headers = { 'KC-API-KEY': config.apiKey, 'KC-API-SIGN': sig, 'KC-API-TIMESTAMP': ts, 'KC-API-PASSPHRASE': pass, 'KC-API-KEY-VERSION': '2', 'Content-Type': 'application/json' };
  const r = await fetch(`${KUCOIN_BASE}${path_}`, { method, headers, body: method !== 'GET' ? bodyStr : undefined });
  const d = await r.json();
  if (d.code !== '200000') throw new Error(d.msg);
  return d.data;
}

async function kucoinGetPrices() {
  const result = {};
  const all = await kucoinPublic('/api/v1/market/allTickers');
  all.ticker.forEach(t => {
    const coin = Object.keys(KUCOIN_PAIRS).find(k => KUCOIN_PAIRS[k] === t.symbol);
    if (coin) result[coin] = parseFloat(t.last);
  });
  return result;
}

async function kucoinGetBalances() {
  const data = await kucoinSigned('GET', '/api/v1/accounts');
  const out = {};
  data.filter(a => a.type === 'trade').forEach(a => { const v = parseFloat(a.available); if (v > 0) out[a.currency] = v; });
  return out;
}

async function kucoinPlaceOrder(coin, side, qty) {
  const sym = KUCOIN_PAIRS[coin];
  return kucoinSigned('POST', '/api/v1/orders', { clientOid: Date.now().toString(), side: side.toLowerCase(), symbol: sym, type: 'market', size: qty.toString() });
}

// ─── Binance ──────────────────────────────────────────────────────────────────
const BINANCE_BASE = 'https://api.binance.com';
const BINANCE_PAIRS = { BTC:'BTCEUR', ETH:'ETHEUR', SOL:'SOLEUR', BNB:'BNBEUR', XRP:'XRPEUR', ADA:'ADAEUR' };

async function binancePublic(ep, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${BINANCE_BASE}${ep}${qs ? '?' + qs : ''}`);
  if (!r.ok) throw new Error('Binance HTTP ' + r.status);
  return r.json();
}

async function binanceSigned(method, ep, params = {}) {
  params.timestamp = Date.now(); params.recvWindow = 5000;
  const qs = new URLSearchParams(params).toString();
  const sig = crypto.createHmac('sha256', config.apiSecret).update(qs).digest('hex');
  const url = `${BINANCE_BASE}${ep}?${qs}&signature=${sig}`;
  const r = await fetch(url, { method, headers: { 'X-MBX-APIKEY': config.apiKey } });
  const d = await r.json();
  if (!r.ok) throw new Error(d.msg || 'Binance error');
  return d;
}

async function binanceGetPrices() {
  const syms = config.coins.map(c => BINANCE_PAIRS[c]).filter(Boolean);
  const data = await binancePublic('/api/v3/ticker/price', { symbols: JSON.stringify(syms) });
  const result = {};
  data.forEach(t => { const coin = Object.keys(BINANCE_PAIRS).find(k => BINANCE_PAIRS[k] === t.symbol); if (coin) result[coin] = parseFloat(t.price); });
  return result;
}

async function binanceGetBalances() {
  const d = await binanceSigned('GET', '/api/v3/account', {});
  const out = {};
  d.balances?.forEach(b => { const v = parseFloat(b.free); if (v > 0) out[b.asset] = v; });
  return out;
}

async function binancePlaceOrder(coin, side, qty) {
  const sym = BINANCE_PAIRS[coin];
  return binanceSigned('POST', '/api/v3/order', { symbol: sym, side, type: 'MARKET', quantity: qty });
}

// ─── Exchange router ──────────────────────────────────────────────────────────
async function getPrices()     { return { kraken: krakenGetPrices, bybit: bybitGetPrices, kucoin: kucoinGetPrices, binance: binanceGetPrices }[config.exchange](); }
async function getBalances()   { return { kraken: krakenGetBalances, bybit: bybitGetBalances, kucoin: kucoinGetBalances, binance: binanceGetBalances }[config.exchange](); }
async function placeOrder(coin, side, qty) { return { kraken: krakenPlaceOrder, bybit: bybitPlaceOrder, kucoin: kucoinPlaceOrder, binance: binancePlaceOrder }[config.exchange](coin, side, qty); }

function getQuoteCurrency() {
  if (config.exchange === 'kraken' || config.exchange === 'binance') return 'EUR';
  return 'USDT';
}

// ════════════════════════════════════════════════════════════════════════════════
//  PRICE POLLING
// ════════════════════════════════════════════════════════════════════════════════
async function fetchPrices() {
  try {
    const prices = await getPrices();
    Object.assign(state.prices, prices);
    Object.entries(prices).forEach(([coin, price]) => {
      if (!state.priceHistory[coin]) state.priceHistory[coin] = [];
      state.priceHistory[coin].push(price);
      if (state.priceHistory[coin].length > 60) state.priceHistory[coin].shift();
    });
    broadcast({ type: 'prices', data: state.prices, history: state.priceHistory });
  } catch (e) {
    console.error('[prices]', e.message);
    // Variation simulée en cas d'erreur réseau
    config.coins.forEach(coin => {
      if (!state.prices[coin]) return;
      state.prices[coin] *= 1 + (Math.random() - 0.499) * 0.003;
      if (!state.priceHistory[coin]) state.priceHistory[coin] = [];
      state.priceHistory[coin].push(state.prices[coin]);
      if (state.priceHistory[coin].length > 60) state.priceHistory[coin].shift();
    });
    broadcast({ type: 'prices', data: state.prices, history: state.priceHistory });
  }
}

async function fetchBalances() {
  if (config.mode !== 'live' || !config.apiKey) return;
  try {
    state.realBalances = await getBalances();
    broadcast({ type: 'balances', data: state.realBalances });
  } catch (e) {
    broadcast({ type: 'error', msg: 'Balance: ' + e.message });
  }
}

// ════════════════════════════════════════════════════════════════════════════════
//  INDICATORS
// ════════════════════════════════════════════════════════════════════════════════
function calcRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const d = prices[i] - prices[i - 1];
    if (d > 0) gains += d; else losses -= d;
  }
  const rs = (gains / period) / ((losses / period) || 0.001);
  return 100 - 100 / (1 + rs);
}

function calcEMA(prices, period) {
  const k = 2 / (period + 1);
  return prices.reduce((ema, p, i) => i === 0 ? p : p * k + ema * (1 - k), prices[0] || 0);
}

function computeSignal(coin) {
  const h = state.priceHistory[coin] || [];
  const price = state.prices[coin] || 0;
  if (h.length < 5) return { signal: 'WATCH', rsi: 50, macd: 0, score: 0, price, ma20: price };
  const rsi = calcRSI(h);
  const ema12 = calcEMA(h, 12), ema26 = calcEMA(h, 26);
  const macd = ema12 - ema26;
  const ma20 = h.length >= 20 ? h.slice(-20).reduce((a, b) => a + b, 0) / 20 : h.reduce((a, b) => a + b, 0) / h.length;
  let score = 0;
  if (rsi < 35) score += 2; else if (rsi < 45) score += 1; else if (rsi > 65) score -= 2; else if (rsi > 55) score -= 1;
  if (macd > 0) score += 1; else score -= 1;
  if (price > ma20) score += 1; else score -= 1;
  return { signal: score >= 3 ? 'BUY' : score <= -3 ? 'SELL' : score >= 1 ? 'WATCH' : 'HOLD', rsi, macd, score, price, ma20 };
}

// ════════════════════════════════════════════════════════════════════════════════
//  BOT LOGIC
// ════════════════════════════════════════════════════════════════════════════════
async function botTick() {
  const isLive = config.mode === 'live';
  const slPct  = config.stopLoss / 100;
  const tpPct  = config.takeProfit / 100;
  const tradePct = config.tradePercent / 100;
  const quote = getQuoteCurrency();

  for (const coin of config.coins) {
    const price = state.prices[coin];
    if (!price) continue;
    const pos = state.openPositions[coin];

    // Check SL / TP
    if (pos) {
      const pnlPct = (price - pos.entry) / pos.entry;
      const hit = pnlPct <= -slPct ? 'Stop-Loss' : pnlPct >= tpPct ? 'Take-Profit' : null;
      if (hit) {
        try {
          if (isLive) await placeOrder(coin, 'SELL', parseFloat(pos.qty.toFixed(8)));
          const pnl = (price - pos.entry) * pos.qty;
          state.totalPnl += pnl;
          if (pnl > 0) state.wins++;
          if (!isLive) state.simBalance += pos.amount + pnl;
          state.trades.unshift({ coin, entry: pos.entry, exit: price, qty: pos.qty, pnl, amount: pos.amount, reason: hit, mode: isLive ? 'RÉEL' : 'SIM', exchange: config.exchange.toUpperCase(), time: new Date().toISOString() });
          delete state.openPositions[coin];
          broadcast({ type: 'log', level: pnl >= 0 ? 'win' : 'loss', msg: `${pnl>=0?'🟢':'🔴'} CLÔTURE ${coin} (${hit}) · PnL: ${pnl>=0?'+':''}€${pnl.toFixed(2)}` });
          broadcast({ type: 'trade_closed', trade: state.trades[0] });
          if (isLive) await fetchBalances();
        } catch (e) { broadcast({ type: 'error', msg: `Clôture ${coin}: ${e.message}` }); }
      }
      continue;
    }

    const sig = computeSignal(coin);
    if (sig.signal !== 'BUY') continue;

    try {
      let amount, qty;
      if (isLive) {
        const bal = state.realBalances[quote] || state.realBalances['EUR'] || 0;
        amount = bal * tradePct;
        if (amount < 5) { broadcast({ type: 'log', level: 'warn', msg: `⚠️ ${coin} — balance ${quote} insuffisante (${bal.toFixed(2)})` }); continue; }
        qty = amount / price;
        await placeOrder(coin, 'BUY', parseFloat(qty.toFixed(8)));
        await fetchBalances();
      } else {
        amount = state.simBalance * tradePct;
        if (amount < 0.5) continue;
        qty = amount / price;
        state.simBalance -= amount;
      }
      state.openPositions[coin] = { entry: price, qty, amount, time: Date.now() };
      broadcast({ type: 'log', level: 'buy', msg: `🟢 ACHAT ${coin} @ €${price.toFixed(2)} · €${amount.toFixed(2)} · [${config.exchange.toUpperCase()}] ${isLive?'RÉEL':'SIM'}` });
      broadcast({ type: 'position_opened', coin, position: state.openPositions[coin] });
    } catch (e) { broadcast({ type: 'error', msg: `Achat ${coin}: ${e.message}` }); }
  }
  broadcastState();
}

function broadcastState() {
  broadcast({
    type: 'state',
    simBalance:    state.simBalance,
    realBalances:  state.realBalances,
    openPositions: state.openPositions,
    totalPnl:      state.totalPnl,
    wins:          state.wins,
    totalTrades:   state.trades.length,
    botRunning:    state.botRunning,
    mode:          config.mode,
    exchange:      config.exchange,
    signals:       Object.fromEntries(config.coins.map(c => [c, computeSignal(c)])),
  });
}

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(ws => { if (ws.readyState === WebSocket.OPEN) ws.send(msg); });
}

// ════════════════════════════════════════════════════════════════════════════════
//  REST API
// ════════════════════════════════════════════════════════════════════════════════
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/status', (_, res) => res.json({ ok: true, mode: config.mode, exchange: config.exchange, botRunning: state.botRunning }));

app.get('/api/config', (_, res) => res.json({ ...config, apiSecret: config.apiSecret ? '••••' : '', apiPassphrase: config.apiPassphrase ? '••••' : '' }));

app.post('/api/config', (req, res) => {
  const { exchange, apiKey, apiSecret, apiPassphrase, mode, startBalance, tradePercent, stopLoss, takeProfit, strategy, coins } = req.body;
  if (exchange      !== undefined) config.exchange = exchange;
  if (apiKey        !== undefined) config.apiKey = apiKey;
  if (apiSecret     !== undefined && !apiSecret.includes('••')) config.apiSecret = apiSecret;
  if (apiPassphrase !== undefined && !apiPassphrase.includes('••')) config.apiPassphrase = apiPassphrase;
  if (mode          !== undefined) config.mode = mode;
  if (startBalance  !== undefined) { config.startBalance = parseFloat(startBalance); state.simBalance = config.startBalance; }
  if (tradePercent  !== undefined) config.tradePercent = parseFloat(tradePercent);
  if (stopLoss      !== undefined) config.stopLoss = parseFloat(stopLoss);
  if (takeProfit    !== undefined) config.takeProfit = parseFloat(takeProfit);
  if (strategy      !== undefined) config.strategy = strategy;
  if (coins         !== undefined) config.coins = coins;
  saveConfig();
  res.json({ ok: true });
});

app.post('/api/test-connection', async (req, res) => {
  try {
    const balances = await getBalances();
    state.realBalances = balances;
    res.json({ ok: true, balances, exchange: config.exchange });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

app.post('/api/bot/start', (_, res) => {
  if (state.botRunning) return res.json({ ok: true });
  state.botRunning = true;
  state.botInterval = setInterval(botTick, 15000);
  botTick();
  broadcast({ type: 'log', level: 'info', msg: `🤖 Bot démarré · ${config.exchange.toUpperCase()} · Mode ${config.mode.toUpperCase()}` });
  res.json({ ok: true });
});

app.post('/api/bot/stop', (_, res) => {
  state.botRunning = false;
  clearInterval(state.botInterval);
  broadcast({ type: 'log', level: 'info', msg: '⏹ Bot arrêté' });
  res.json({ ok: true });
});

app.post('/api/bot/reset', (_, res) => {
  state.botRunning = false;
  clearInterval(state.botInterval);
  state.simBalance = config.startBalance;
  state.trades = [];
  state.openPositions = {};
  state.totalPnl = 0;
  state.wins = 0;
  broadcast({ type: 'log', level: 'info', msg: '↺ Réinitialisé' });
  broadcastState();
  res.json({ ok: true });
});

app.get('/api/trades', (_, res) => res.json(state.trades));

app.post('/api/close/:coin', async (req, res) => {
  const { coin } = req.params;
  const pos = state.openPositions[coin];
  if (!pos) return res.status(404).json({ error: 'Position introuvable' });
  try {
    const price = state.prices[coin];
    if (config.mode === 'live') await placeOrder(coin, 'SELL', parseFloat(pos.qty.toFixed(8)));
    const pnl = (price - pos.entry) * pos.qty;
    state.totalPnl += pnl;
    if (pnl > 0) state.wins++;
    if (config.mode === 'sim') state.simBalance += pos.amount + pnl;
    state.trades.unshift({ coin, entry: pos.entry, exit: price, qty: pos.qty, pnl, amount: pos.amount, reason: 'Manuel', mode: config.mode === 'live' ? 'RÉEL' : 'SIM', exchange: config.exchange.toUpperCase(), time: new Date().toISOString() });
    delete state.openPositions[coin];
    if (config.mode === 'live') await fetchBalances();
    broadcastState();
    res.json({ ok: true, pnl });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── WebSocket ────────────────────────────────────────────────────────────────
wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'connected', mode: config.mode, exchange: config.exchange, botRunning: state.botRunning }));
  broadcastState();
  ws.send(JSON.stringify({ type: 'trades', data: state.trades }));
});

// ─── Start ────────────────────────────────────────────────────────────────────
async function startPricePolling() {
  await fetchPrices();
  await fetchBalances();
  setInterval(async () => { await fetchPrices(); await fetchBalances(); if (state.botRunning) broadcastState(); }, 10000);
}

server.listen(PORT, '0.0.0.0', async () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const ips = Object.values(nets).flat().filter(n => n.family === 'IPv4' && !n.internal).map(n => n.address);

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║      TradeMind — Multi-Exchange Bot       ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log(`║  PC      : http://localhost:${PORT}           ║`);
  ips.forEach(ip => console.log(`║  Mobile  : http://${ip}:${PORT}       ║`));
  console.log(`║  Exchange : ${config.exchange.toUpperCase().padEnd(30)} ║`);
  console.log(`║  Mode     : ${config.mode.toUpperCase().padEnd(30)} ║`);
  console.log('╚═══════════════════════════════════════════╝\n');
  console.log('  Exchanges supportés : Kraken · Bybit · KuCoin · Binance\n');

  await startPricePolling();
});
