import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatTimerDisplay, calculateKnockout, WEAPONS } from '../data/tamingCalculator';
import { ClockIcon, DropletIcon, ZapIcon, ShieldIcon, PlayIcon, PauseIcon, ResetIcon, PlusIcon, PillIcon, AlertIcon, SkullIcon, SparklesIcon, InfoIcon } from './Icons';
import { NARCOTICS } from '../data/dinosaurs';

export default function TamingPanel({ result, dino, level, sanguineElixir }) {
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
    if (result.torporDrainPerSec > 0) {
      setTorporTimeLeft(prev => Math.min(result.torporTimerSeconds, prev + torpAmount / result.torporDrainPerSec));
    }
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
          {sanguineElixir && (
            <span className="tp-sanguine-badge">
              <img
                src="https://ark.wiki.gg/images/thumb/Sanguine_Elixir.png/20px-Sanguine_Elixir.png"
                alt=""
                style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: 3 }}
                onError={e => { e.target.style.display = 'none'; }}
              />
              +30%
            </span>
          )}
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
          Attendez que la barre de faim descende suffisamment, puis donnez <strong>{result.foodNeeded} {result.foodName}</strong>.
          {!starveExpanded && <button className="tp-read-more" onClick={() => setStarveExpanded(true)}>(lire plus)</button>}
          {starveExpanded && (
            <span> La durée varie selon la nourriture choisie : une nourriture à haute valeur (ex. kibble) demande plus d'attente car la barre doit descendre davantage pour accepter chaque item. Attendez que le timer arrive à 0 avant de déposer la nourriture.{' '}
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
            <div className="tp-eff-sublabel">Wild</div>
          </div>
          <div className="tp-eff-item tp-eff-max">
            <div className="tp-eff-label">Lvl {result.maxLevel}</div>
            <div className="tp-eff-sublabel">Tamed Max</div>
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

      {/* SECTION 5: Narcotics (Knockout only) */}
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

      {/* SECTION 6: Knockout Calculator (Knockout only) */}
      {!isPassive && <KnockoutCalc dino={dino} level={level} />}

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

const QUALITY_PRESETS = [
  { label: '100%', value: 100 },
  { label: '200%', value: 200 },
  { label: '300%', value: 300 },
  { label: '400%', value: 400 },
];

function KnockoutCalc({ dino, level }) {
  const [quality, setQuality] = useState(100);
  const [activeWeapon, setActiveWeapon] = useState('bow');

  const koResults = useMemo(() => calculateKnockout(dino, level, quality), [dino, level, quality]);
  const selected = koResults.find(w => w.key === activeWeapon) || koResults[0];

  const riskColor = selected.killRisk === 'high' ? 'var(--red)' : selected.killRisk === 'med' ? 'var(--orange)' : 'var(--green)';
  const riskLabel = selected.killRisk === 'high' ? 'Danger' : selected.killRisk === 'med' ? 'Risque' : 'Safe';

  return (
    <div className="tp-section tp-knockout">
      <div className="tp-section-header">
        <SkullIcon size={14} />
        <span>Knockout Calculator</span>
      </div>

      {/* Quality input */}
      <div className="tp-ko-quality-row">
        <span className="tp-ko-quality-label">Dégâts arme</span>
        <input
          type="number" min={100} max={999} step={10}
          value={quality}
          onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 100) setQuality(v); }}
          className="tp-ko-quality-input"
        />
        <span className="tp-ko-quality-pct">%</span>
      </div>
      <div className="tp-ko-presets">
        {QUALITY_PRESETS.map(p => (
          <button key={p.value}
            className={`tp-btn tp-btn-xs ${quality === p.value ? 'active' : ''}`}
            onClick={() => setQuality(p.value)}
          >{p.label}</button>
        ))}
      </div>

      {/* Weapon tabs */}
      <div className="tp-ko-weapon-tabs">
        {koResults.map(w => (
          <button key={w.key}
            className={`tp-ko-tab ${activeWeapon === w.key ? 'active' : ''}`}
            onClick={() => setActiveWeapon(w.key)}
          >
            <div className="tp-ko-tab-imgs">
              <img src={w.img} alt={w.name} className="tp-ko-tab-img" onError={e => { e.target.style.display = 'none'; }} />
              <span className="tp-ko-tab-plus">+</span>
              <img src={w.ammoImg} alt={w.ammo} className="tp-ko-tab-ammo-img" onError={e => { e.target.style.display = 'none'; }} />
            </div>
            <span className="tp-ko-tab-name">{w.name}</span>
            <span className="tp-ko-tab-ammo-name">{w.ammo}</span>
          </button>
        ))}
      </div>

      {/* Selected weapon stats */}
      {selected && (
        <div className="tp-ko-stats">
          <div className="tp-ko-grid">
            <div className="tp-ko-cell">
              <div className="tp-ko-cell-label">Corps</div>
              <div className="tp-ko-cell-shots">{selected.shotsBody}</div>
              <div className="tp-ko-cell-sub">tirs</div>
              <div className="tp-ko-cell-dmg">{selected.dmgBody} dmg</div>
            </div>
            <div className="tp-ko-cell tp-ko-cell-head">
              <div className="tp-ko-cell-label">Tête 🎯</div>
              <div className="tp-ko-cell-shots">{selected.shotsHead}</div>
              <div className="tp-ko-cell-sub">tirs</div>
              <div className="tp-ko-cell-dmg">{selected.dmgHead} dmg</div>
            </div>
            <div className="tp-ko-cell tp-ko-cell-risk">
              <div className="tp-ko-cell-label">Risque de mort</div>
              <div className="tp-ko-cell-shots" style={{ color: riskColor }}>{riskLabel}</div>
              <div className="tp-ko-cell-sub" style={{ color: riskColor }}>{selected.dmgBody} / tir</div>
            </div>
          </div>
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
