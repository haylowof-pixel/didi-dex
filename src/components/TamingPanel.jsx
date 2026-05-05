import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { formatTimerDisplay } from '../data/tamingCalculator';
import { ClockIcon, DropletIcon, ZapIcon, ShieldIcon, PlayIcon, PauseIcon, ResetIcon, PlusIcon, PillIcon, AlertIcon, SkullIcon, SparklesIcon, InfoIcon } from './Icons';
import { NARCOTICS, TRAP_TYPES } from '../data/dinosaurs';

function TrapSchema({ trapType }) {
  if (!trapType || !TRAP_TYPES[trapType]) return null;
  const trap = TRAP_TYPES[trapType];

  // SVG diagrams drawn top-down
  const diagrams = {
    '2gate': (
      <svg viewBox="0 0 120 80" width="120" height="80" style={{display:'block',margin:'0 auto'}}>
        {/* Left gate */}
        <rect x="4" y="8" width="10" height="64" rx="2" fill="#ef4444" opacity="0.85"/>
        <rect x="2" y="4" width="14" height="6" rx="1" fill="#ef4444"/>
        <rect x="2" y="70" width="14" height="6" rx="1" fill="#ef4444"/>
        {/* Right gate */}
        <rect x="106" y="8" width="10" height="64" rx="2" fill="#ef4444" opacity="0.85"/>
        <rect x="104" y="4" width="14" height="6" rx="1" fill="#ef4444"/>
        <rect x="104" y="70" width="14" height="6" rx="1" fill="#ef4444"/>
        {/* Top walls */}
        <rect x="18" y="4" width="20" height="7" rx="1" fill="#94a3b8" opacity="0.7"/>
        <rect x="42" y="4" width="20" height="7" rx="1" fill="#94a3b8" opacity="0.7"/>
        <rect x="66" y="4" width="20" height="7" rx="1" fill="#94a3b8" opacity="0.7"/>
        {/* Bottom walls */}
        <rect x="18" y="69" width="20" height="7" rx="1" fill="#94a3b8" opacity="0.7"/>
        <rect x="42" y="69" width="20" height="7" rx="1" fill="#94a3b8" opacity="0.7"/>
        <rect x="66" y="69" width="20" height="7" rx="1" fill="#94a3b8" opacity="0.7"/>
        {/* Dino */}
        <text x="60" y="44" textAnchor="middle" fontSize="20" dominantBaseline="middle">🦖</text>
        {/* Arrows (close gates) */}
        <text x="24" y="44" textAnchor="middle" fontSize="11" fill="#ef4444" dominantBaseline="middle">→</text>
        <text x="96" y="44" textAnchor="middle" fontSize="11" fill="#ef4444" dominantBaseline="middle">←</text>
      </svg>
    ),
    '1gate': (
      <svg viewBox="0 0 100 70" width="100" height="70" style={{display:'block',margin:'0 auto'}}>
        {/* Gate (left side) */}
        <rect x="4" y="6" width="10" height="58" rx="2" fill="#f59e0b" opacity="0.85"/>
        <rect x="2" y="2" width="14" height="6" rx="1" fill="#f59e0b"/>
        <rect x="2" y="62" width="14" height="6" rx="1" fill="#f59e0b"/>
        {/* Walls top */}
        <rect x="18" y="2" width="65" height="7" rx="1" fill="#94a3b8" opacity="0.7"/>
        {/* Walls bottom */}
        <rect x="18" y="61" width="65" height="7" rx="1" fill="#94a3b8" opacity="0.7"/>
        {/* Dino */}
        <text x="60" y="38" textAnchor="middle" fontSize="18" dominantBaseline="middle">🦕</text>
        {/* Arrow toward gate */}
        <text x="28" y="38" textAnchor="middle" fontSize="13" fill="#f59e0b" dominantBaseline="middle">←</text>
      </svg>
    ),
    'large_trap': (
      <svg viewBox="0 0 90 70" width="90" height="70" style={{display:'block',margin:'0 auto'}}>
        {/* Trap jaws */}
        <rect x="15" y="28" width="60" height="14" rx="3" fill="#f59e0b" opacity="0.2" stroke="#f59e0b" strokeWidth="1.5"/>
        {/* Teeth top */}
        {[20,30,40,50,60,70].map(function(x,i){return(<polygon key={i} points={`${x},28 ${x+4},28 ${x+2},18`} fill="#f59e0b" opacity="0.8"/>);})}
        {/* Teeth bottom */}
        {[22,32,42,52,62].map(function(x,i){return(<polygon key={i} points={`${x},42 ${x+4},42 ${x+2},52`} fill="#f59e0b" opacity="0.8"/>);})}
        {/* Chain */}
        <line x1="45" y1="54" x2="45" y2="65" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3,2"/>
        {/* Label */}
        <text x="45" y="10" textAnchor="middle" fontSize="8" fill="#f59e0b">GRAND PIÈGE</text>
        {/* Dino */}
        <text x="45" y="62" textAnchor="middle" fontSize="14" dominantBaseline="middle">⬇</text>
      </svg>
    ),
    'bear_trap': (
      <svg viewBox="0 0 80 60" width="80" height="60" style={{display:'block',margin:'0 auto'}}>
        <rect x="20" y="22" width="40" height="10" rx="2" fill="#60a5fa" opacity="0.2" stroke="#60a5fa" strokeWidth="1.5"/>
        {[24,30,36,42,48,54].map(function(x,i){return(<polygon key={i} points={`${x},22 ${x+3},22 ${x+1.5},14`} fill="#60a5fa" opacity="0.8"/>);})}
        {[26,32,38,44,50].map(function(x,i){return(<polygon key={i} points={`${x},32 ${x+3},32 ${x+1.5},40`} fill="#60a5fa" opacity="0.8"/>);})}
        <line x1="40" y1="42" x2="40" y2="52" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3,2"/>
        <text x="40" y="8" textAnchor="middle" fontSize="8" fill="#60a5fa">PIÈGE</text>
      </svg>
    ),
    'bola': (
      <svg viewBox="0 0 80 60" width="80" height="60" style={{display:'block',margin:'0 auto'}}>
        {/* Bola ball left */}
        <circle cx="18" cy="18" r="6" fill="#a78bfa" opacity="0.9"/>
        {/* Bola ball right */}
        <circle cx="62" cy="18" r="6" fill="#a78bfa" opacity="0.9"/>
        {/* Bola ball bottom */}
        <circle cx="40" cy="42" r="6" fill="#a78bfa" opacity="0.9"/>
        {/* Strings */}
        <line x1="18" y1="18" x2="40" y2="30" stroke="#a78bfa" strokeWidth="1.5"/>
        <line x1="62" y1="18" x2="40" y2="30" stroke="#a78bfa" strokeWidth="1.5"/>
        <line x1="40" y1="42" x2="40" y2="30" stroke="#a78bfa" strokeWidth="1.5"/>
        <circle cx="40" cy="30" r="2" fill="#c4b5fd"/>
        <text x="40" y="8" textAnchor="middle" fontSize="8" fill="#a78bfa">BOLA</text>
      </svg>
    ),
    'chain_bola': (
      <svg viewBox="0 0 80 60" width="80" height="60" style={{display:'block',margin:'0 auto'}}>
        <circle cx="20" cy="20" r="7" fill="#ec4899" opacity="0.9"/>
        <circle cx="60" cy="20" r="7" fill="#ec4899" opacity="0.9"/>
        <circle cx="40" cy="44" r="7" fill="#ec4899" opacity="0.9"/>
        <line x1="20" y1="20" x2="40" y2="32" stroke="#ec4899" strokeWidth="2"/>
        <line x1="60" y1="20" x2="40" y2="32" stroke="#ec4899" strokeWidth="2"/>
        <line x1="40" y1="44" x2="40" y2="32" stroke="#ec4899" strokeWidth="2"/>
        <circle cx="40" cy="32" r="3" fill="#f9a8d4"/>
        <text x="40" y="8" textAnchor="middle" fontSize="8" fill="#ec4899">CHAIN BOLA</text>
      </svg>
    ),
  };

  return (
    <div className="tp-trap-schema">
      <div className="tp-trap-header">
        <span className="tp-trap-icon">🪤</span>
        <span className="tp-trap-title">{trap.label}</span>
      </div>
      <div className="tp-trap-diagram">
        {diagrams[trapType] || null}
      </div>
      <div className="tp-trap-desc">{trap.desc}</div>
    </div>
  );
}

export default function TamingPanel({ result, dino, level }) {
  const isPassive = dino.tamingMethod === 'Passive';

  const [starveTimeLeft, setStarveTimeLeft] = useState(result.starveTimeSeconds);
  const [starveRunning, setStarveRunning] = useState(false);
  const starveInterval = useRef(null);
  const [starveExpanded, setStarveExpanded] = useState(false);

  const [torporTimeLeft, setTorporTimeLeft] = useState(result.torporTimerSeconds);
  const [torporRunning, setTorporRunning] = useState(false);
  const torporInterval = useRef(null);
  const [torporExpanded, setTorporExpanded] = useState(false);

  const [narcUsed, setNarcUsed] = useState({ narcotic: 0, narcoberry: 0, ascerbic: 0, biotoxin: 0 });

  // Passive taming: feeding interval timer
  const feedingIntervalSec = result.secondsPerFood || 0;
  const [feedTimeLeft, setFeedTimeLeft] = useState(feedingIntervalSec);
  const [feedRunning, setFeedRunning] = useState(false);
  const feedInterval = useRef(null);

  const playAlert = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880; osc.type = 'sine'; gain.gain.value = 0.25;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }, []);

  const prevKey = useRef(`${result.level}-${result.foodKey}-${result.foodNeeded}`);
  useEffect(() => {
    const key = `${result.level}-${result.foodKey}-${result.foodNeeded}`;
    if (key !== prevKey.current) {
      clearInterval(starveInterval.current);
      clearInterval(torporInterval.current);
      setStarveRunning(false);
      setTorporRunning(false);
      setStarveTimeLeft(result.starveTimeSeconds);
      setTorporTimeLeft(result.torporTimerSeconds);
      setNarcUsed({ narcotic: 0, narcoberry: 0, ascerbic: 0, biotoxin: 0 });
      prevKey.current = key;
    }
  }, [result]);

  useEffect(() => {
    if (starveRunning) {
      starveInterval.current = setInterval(() => {
        setStarveTimeLeft(prev => {
          if (prev <= 1) { clearInterval(starveInterval.current); setStarveRunning(false); playAlert(); window.api?.showNotification({ title: 'OVERSEER - Starve Timer', body: 'Le starve timer est terminé ! Nourris le dino maintenant.' }); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else { clearInterval(starveInterval.current); }
    return () => clearInterval(starveInterval.current);
  }, [starveRunning, playAlert]);

  useEffect(() => {
    if (torporRunning) {
      torporInterval.current = setInterval(() => {
        setTorporTimeLeft(prev => {
          if (prev <= 1) { clearInterval(torporInterval.current); setTorporRunning(false); playAlert(); return 0; }
          if (prev <= result.torporTimerSeconds * 0.2 + 1 && prev > result.torporTimerSeconds * 0.2) playAlert();
          return prev - 1;
        });
      }, 1000);
    } else { clearInterval(torporInterval.current); }
    return () => clearInterval(torporInterval.current);
  }, [torporRunning, result.torporTimerSeconds, playAlert]);

  // Passive taming: feeding interval countdown
  useEffect(() => {
    if (feedRunning) {
      feedInterval.current = setInterval(() => {
        setFeedTimeLeft(prev => {
          if (prev <= 1) { clearInterval(feedInterval.current); setFeedRunning(false); playAlert(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else { clearInterval(feedInterval.current); }
    return () => clearInterval(feedInterval.current);
  }, [feedRunning, playAlert]);

  // Reset feeding timer when result changes
  useEffect(() => {
    setFeedTimeLeft(result.secondsPerFood || 0);
    setFeedRunning(false);
    clearInterval(feedInterval.current);
  }, [result.secondsPerFood]);

  const addNarc = (type, torpAmount) => {
    setNarcUsed(prev => ({ ...prev, [type]: prev[type] + 1 }));
    setTorporTimeLeft(prev => Math.min(result.torporTimerSeconds, prev + torpAmount / result.torporDrainPerSec));
  };

  const torporPercent = result.torporTimerSeconds > 0 ? (torporTimeLeft / result.torporTimerSeconds) * 100 : 0;
  const starvePercent = result.starveTimeSeconds > 0 ? ((result.starveTimeSeconds - starveTimeLeft) / result.starveTimeSeconds) * 100 : 0;
  const torporLow = torporPercent <= 25;
  const torporDanger = torporPercent <= 10;

  const drainColor = result.torporDrainCategory === 'Very High' ? 'var(--red)' :
                     result.torporDrainCategory === 'High' ? 'var(--orange)' :
                     result.torporDrainCategory === 'Medium' ? 'var(--food-color)' : 'var(--green)';

  // ── Sync timers to widget & overlay via IPC ──
  useEffect(() => {
    if (!window.api?.syncTimerData) return;
    if (!starveRunning && !torporRunning) return;

    const syncData = () => {
      window.api.syncTimerData({
        dinoName: dino.name,
        starveTime: formatTimerDisplay(starveTimeLeft),
        torporTime: formatTimerDisplay(torporTimeLeft),
        starvePercent: result.starveTimeSeconds > 0 ? ((result.starveTimeSeconds - starveTimeLeft) / result.starveTimeSeconds) * 100 : 0,
        torporPercent: result.torporTimerSeconds > 0 ? (torporTimeLeft / result.torporTimerSeconds) * 100 : 0,
        starveRunning,
        torporRunning,
        foodCurrent: result.foodNeeded,
        foodMax: result.foodNeeded,
        foodRequired: result.foodNeeded,
        torporCurrent: Math.round(result.maxTorpor * (torporTimeLeft / (result.torporTimerSeconds || 1))),
        torporMax: result.maxTorpor,
        narcoCount: result.narcoticsNeeded,
        bioCount: result.bioToxinNeeded,
      });
    };

    syncData(); // sync immediately
    const interval = setInterval(syncData, 1000);
    return () => clearInterval(interval);
  }, [starveRunning, torporRunning, starveTimeLeft, torporTimeLeft, dino.name, result]);

  return (
    <div className="taming-panel" key={`${result.level}-${result.foodKey}`}>

      {/* SECTION 1: Food result */}
      <div className="tp-section">
        <div className="tp-section-header">
          <DropletIcon size={14} />
          <span>Avec {result.foodName}</span>
        </div>
        <div className="tp-total-time">
          <span className="tp-total-time-label">TEMPS TOTAL</span>
          <span className="tp-total-time-value">{result.totalTimeFmt}</span>
        </div>
        <div className="tp-food-needed">
          <ClockIcon size={16} />
          <span className="tp-food-needed-count">{result.foodNeeded}</span>
          <span className="tp-food-needed-name">{result.foodName}</span>
        </div>
      </div>

      {/* SECTION 2: Starve Timer (Knockout only) */}
      {!isPassive && (
      <div className="tp-section tp-starve">
        <div className="tp-section-header">
          <ClockIcon size={14} />
          <span>Starve Timer</span>
          <span className="tp-timer-value">{formatTimerDisplay(starveTimeLeft)}</span>
        </div>
        <div className="tp-progress">
          <div className="tp-progress-bar tp-progress-orange" style={{ width: `${starvePercent}%` }} />
        </div>
        <div className="tp-info-text">
          Le starve taming consiste à laisser la faim du dino descendre avant de le nourrir d'un coup.
          {!starveExpanded && <button className="tp-read-more" onClick={() => setStarveExpanded(true)}>(lire plus)</button>}
          {starveExpanded && (
            <span> Attendez que le timer arrive à 0, puis donnez toute la nourriture d'un coup. Cela garantit que vous ne perdez rien si le dino se réveille.{' '}
              <button className="tp-read-more" onClick={() => setStarveExpanded(false)}>(réduire)</button>
            </span>
          )}
        </div>
        <div className="tp-timer-controls">
          {!starveRunning ? (
            <button className="tp-btn tp-btn-primary" onClick={() => setStarveRunning(true)}>
              <PlayIcon size={11} /> Démarrer
            </button>
          ) : (
            <button className="tp-btn" onClick={() => setStarveRunning(false)}>
              <PauseIcon size={11} /> Pause
            </button>
          )}
          <button className="tp-btn tp-btn-ghost" onClick={() => { setStarveTimeLeft(result.starveTimeSeconds); setStarveRunning(false); }}>
            <ResetIcon size={11} /> Reset
          </button>
        </div>
      </div>
      )}

      {/* Passive Taming Section */}
      {isPassive && (
      <div className="tp-section tp-passive">
        <div className="tp-section-header">
          <DropletIcon size={14} />
          <span>Passive Taming</span>
        </div>
        <div className="tp-info-text">
          Approche la créature et nourris-la à la main
        </div>
        <div className="tp-food-needed">
          <ClockIcon size={16} />
          <span className="tp-food-needed-count">{feedingIntervalSec}s</span>
          <span className="tp-food-needed-name">entre chaque nourrissage</span>
        </div>
        <div className="tp-section-header" style={{ marginTop: '8px' }}>
          <ClockIcon size={14} />
          <span>Feeding Interval</span>
          <span className="tp-timer-value">{formatTimerDisplay(feedTimeLeft)}</span>
        </div>
        <div className="tp-progress">
          <div className="tp-progress-bar tp-progress-orange" style={{ width: `${feedingIntervalSec > 0 ? ((feedingIntervalSec - feedTimeLeft) / feedingIntervalSec) * 100 : 0}%` }} />
        </div>
        <div className="tp-timer-controls">
          {!feedRunning ? (
            <button className="tp-btn tp-btn-primary" onClick={() => setFeedRunning(true)}>
              <PlayIcon size={11} /> Démarrer
            </button>
          ) : (
            <button className="tp-btn" onClick={() => setFeedRunning(false)}>
              <PauseIcon size={11} /> Pause
            </button>
          )}
          <button className="tp-btn tp-btn-ghost" onClick={() => { setFeedTimeLeft(feedingIntervalSec); setFeedRunning(false); }}>
            <ResetIcon size={11} /> Reset
          </button>
        </div>
        {feedTimeLeft <= 0 && (
          <motion.div className="tp-alert-danger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'var(--green)', borderColor: 'var(--green)' }}>
            <DropletIcon size={13} /> Nourris la créature maintenant !
          </motion.div>
        )}
      </div>
      )}

      {/* SECTION 3: Effectiveness */}
      <div className="tp-section tp-effectiveness">
        <div className="tp-eff-grid">
          <div className="tp-eff-item">
            <div className="tp-eff-label">Lvl {level}</div>
            <div className="tp-eff-sublabel">Current</div>
          </div>
          <div className="tp-eff-item tp-eff-bonus">
            <div className="tp-eff-label">+{result.bonusLevels}</div>
            <div className="tp-eff-sublabel">{result.effectiveness}%</div>
            <div className="tp-eff-sublabel">Taming Eff.</div>
          </div>
          {result.isPerfectTame && (
            <div className="tp-eff-item tp-eff-perfect">
              <div className="tp-eff-perfect-badge"><SparklesIcon size={10} /> Perfect Tame</div>
            </div>
          )}
          <div className="tp-eff-item">
            <div className="tp-eff-label">Lvl {level}</div>
            <div className="tp-eff-sublabel">With Bonus</div>
          </div>
          <div className="tp-eff-item tp-eff-max">
            <div className="tp-eff-label">Lvl {result.maxLevel}</div>
            <div className="tp-eff-sublabel">Max After Taming</div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Torpor Timer (Knockout only) */}
      {!isPassive && (
      <div className={`tp-section tp-torpor ${torporDanger ? 'tp-torpor-danger' : ''}`}>
        <div className="tp-section-header">
          <ZapIcon size={14} />
          <span>Torpor Timer</span>
          <span className={`tp-timer-value ${torporLow ? 'tp-timer-warning' : ''}`}>
            {formatTimerDisplay(torporTimeLeft)}
          </span>
        </div>
        <div className="tp-progress">
          <div className={`tp-progress-bar ${torporDanger ? 'tp-progress-red' : 'tp-progress-purple'}`} style={{ width: `${torporPercent}%` }} />
        </div>
        <div className="tp-drain-rate">
          <span className="tp-drain-rate-label">Torpor Drain Rate:</span>
          <span className="tp-drain-rate-badge" style={{ color: drainColor, borderColor: drainColor }}>{result.torporDrainCategory}</span>
          <span className="tp-drain-rate-value">{result.torporDrainPerSec}/s</span>
        </div>
        <div className="tp-info-text">
          {result.torporDrainCategory === 'High' || result.torporDrainCategory === 'Very High'
            ? `La torpeur chute rapidement. Gardez des narcotiques prêts.`
            : `Torpeur ${result.torporDrainCategory === 'Medium' ? 'modérée' : 'lente'}.`}
          {!torporExpanded && <button className="tp-read-more" onClick={() => setTorporExpanded(true)}>(lire plus)</button>}
          {torporExpanded && (
            <span> Torpeur max: {result.maxTorpor.toLocaleString()}. Temps avant réveil: {formatTimerDisplay(result.torporTimerSeconds)}.{' '}
              <button className="tp-read-more" onClick={() => setTorporExpanded(false)}>(réduire)</button>
            </span>
          )}
        </div>
        <div className="tp-timer-controls">
          {!torporRunning ? (
            <button className="tp-btn tp-btn-primary" onClick={() => setTorporRunning(true)}>
              <PlayIcon size={11} /> Démarrer
            </button>
          ) : (
            <button className="tp-btn" onClick={() => setTorporRunning(false)}>
              <PauseIcon size={11} /> Pause
            </button>
          )}
          <button className="tp-btn tp-btn-ghost" onClick={() => { setTorporTimeLeft(result.torporTimerSeconds); setTorporRunning(false); setNarcUsed({ narcotic: 0, narcoberry: 0, ascerbic: 0, biotoxin: 0 }); }}>
            <ResetIcon size={11} /> Reset
          </button>
        </div>

        {torporDanger && torporTimeLeft > 0 && (
          <motion.div className="tp-alert-danger" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AlertIcon size={13} /> Torpeur critique ! Donnez des narcotiques !
          </motion.div>
        )}
        {torporTimeLeft <= 0 && (
          <motion.div className="tp-alert-danger" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <SkullIcon size={13} /> Le dino va se réveiller !
          </motion.div>
        )}
      </div>
      )}

      {/* SECTION 5: Trap Schema (Knockout only) */}
      {!isPassive && dino.trap && (
        <TrapSchema trapType={dino.trap} />
      )}

      {/* SECTION 6: Narcotics (Knockout only) */}
      {!isPassive && (
      <div className="tp-section">
        <div className="tp-section-header">
          <PillIcon size={14} />
          <span>Narcotiques nécessaires</span>
        </div>
        <div className="tp-narc-grid">
          <NarcoticRow imgSrc={NARCOTICS.NARCOTIC.img}   name="Narcotic"           needed={result.narcoticsNeeded}       used={narcUsed.narcotic}  onUse={() => addNarc('narcotic', 40)} />
          <NarcoticRow imgSrc={NARCOTICS.NARCOBERRY.img} name="Narcoberry"         needed={result.narcoberriesNeeded}    used={narcUsed.narcoberry} onUse={() => addNarc('narcoberry', 7.5)} />
          <NarcoticRow imgSrc={NARCOTICS.BIO_TOXIN.img}  name="Bio Toxin"          needed={result.bioToxinNeeded}        used={narcUsed.biotoxin}  onUse={() => addNarc('biotoxin', 80)} />
        </div>
      </div>
      )}

      {/* SECTION 7: Tips */}
      {dino.tips && (
        <div className="tp-section tp-tips">
          <div className="tp-section-header">
            <InfoIcon size={14} />
            <span>Tips</span>
          </div>
          <div className="tp-info-text">{dino.tips}</div>
        </div>
      )}
    </div>
  );
}

function NarcoticRow({ imgSrc, name, needed, used, onUse }) {
  return (
    <div className="tp-narc-row">
      <div className="tp-narc-icon">
        <img src={imgSrc} alt={name} width="22" height="22" style={{ objectFit: 'contain' }} onError={e => { e.target.style.display='none'; }} />
      </div>
      <div className="tp-narc-info">
        <div className="tp-narc-count">{needed}</div>
        <div className="tp-narc-name">{name}</div>
      </div>
      <div className="tp-narc-actions">
        {used > 0 && <span className="tp-narc-used">{used} used</span>}
        <button className="tp-narc-btn" onClick={onUse} title={`Use 1 ${name}`}><PlusIcon size={10} /></button>
      </div>
    </div>
  );
}
