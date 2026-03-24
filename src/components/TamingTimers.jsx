import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { formatTimerDisplay } from '../data/tamingCalculator';

export default function TamingTimers({ result, dino, level, foodOverride }) {
  const calcFoodCount = foodOverride != null ? foodOverride : result.foodNeeded;

  // ===== FOOD TIMER STATE =====
  // User-editable: total food to give and how many already eaten
  const [foodTotal, setFoodTotal] = useState(calcFoodCount);
  const [foodTotalInput, setFoodTotalInput] = useState(String(calcFoodCount));
  const [foodEaten, setFoodEaten] = useState(0);
  const [foodEatenInput, setFoodEatenInput] = useState('0');
  const [foodRunning, setFoodRunning] = useState(false);
  const foodInterval = useRef(null);

  // Derived: remaining food items and time
  const foodRemaining = Math.max(0, foodTotal - foodEaten);
  const totalFoodSeconds = foodTotal * result.secondsPerFood;
  const remainingFoodSeconds = foodRemaining * result.secondsPerFood;

  // The countdown tracks seconds until next food is eaten
  const [nextFoodCountdown, setNextFoodCountdown] = useState(result.secondsPerFood);

  // ===== TORPOR TIMER STATE =====
  const [torporCurrent, setTorporCurrent] = useState(result.maxTorpor);
  const [torporRunning, setTorporRunning] = useState(false);
  const torporInterval = useRef(null);

  // Track calc changes to reset
  const prevMaxTorpor = useRef(result.maxTorpor);
  const prevCalcFood = useRef(calcFoodCount);

  // ===== SOUND =====
  const playAlert = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) { /* Audio not available */ }
  }, []);

  // ===== RESET on calc change =====
  useEffect(() => {
    if (result.maxTorpor !== prevMaxTorpor.current || calcFoodCount !== prevCalcFood.current) {
      clearInterval(torporInterval.current);
      clearInterval(foodInterval.current);
      setTorporRunning(false);
      setFoodRunning(false);

      setTorporCurrent(result.maxTorpor);
      setFoodTotal(calcFoodCount);
      setFoodTotalInput(String(calcFoodCount));
      setFoodEaten(0);
      setFoodEatenInput('0');
      setNextFoodCountdown(result.secondsPerFood);

      prevMaxTorpor.current = result.maxTorpor;
      prevCalcFood.current = calcFoodCount;
    }
  }, [result.maxTorpor, calcFoodCount, result.secondsPerFood]);

  // ===== TORPOR COUNTDOWN =====
  useEffect(() => {
    if (torporRunning) {
      torporInterval.current = setInterval(() => {
        setTorporCurrent(prev => {
          const next = prev - dino.torpor.depletion;
          if (next <= 0) {
            clearInterval(torporInterval.current);
            setTorporRunning(false);
            playAlert();
            return 0;
          }
          if (next <= result.maxTorpor * 0.2 && prev > result.maxTorpor * 0.2) {
            playAlert();
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(torporInterval.current);
    }
    return () => clearInterval(torporInterval.current);
  }, [torporRunning, dino.torpor.depletion, result.maxTorpor, playAlert]);

  // ===== FOOD COUNTDOWN =====
  // Counts down seconds until next food, then increments foodEaten
  useEffect(() => {
    if (foodRunning) {
      foodInterval.current = setInterval(() => {
        setNextFoodCountdown(prev => {
          if (prev <= 1) {
            // One food eaten
            setFoodEaten(fe => {
              const newEaten = fe + 1;
              setFoodEatenInput(String(newEaten));
              if (newEaten >= foodTotal) {
                clearInterval(foodInterval.current);
                setFoodRunning(false);
                playAlert();
              }
              return newEaten;
            });
            return result.secondsPerFood; // reset countdown for next food
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(foodInterval.current);
    }
    return () => clearInterval(foodInterval.current);
  }, [foodRunning, foodTotal, result.secondsPerFood, playAlert]);

  // ===== DERIVED VALUES =====
  const torporPercent = result.maxTorpor > 0 ? (torporCurrent / result.maxTorpor) * 100 : 0;
  const foodPercent = foodTotal > 0 ? (foodEaten / foodTotal) * 100 : 0;
  const torporSecondsLeft = dino.torpor.depletion > 0 ? Math.ceil(torporCurrent / dino.torpor.depletion) : 0;
  const torporWarning = torporPercent <= 20 && torporPercent > 0;
  const torporDanger = torporCurrent <= 0;
  const tamingDone = foodEaten >= foodTotal && foodTotal > 0;

  // Total time remaining = (remaining food - 1) * secondsPerFood + nextFoodCountdown
  const totalFoodTimeLeft = tamingDone ? 0 :
    foodRemaining > 0 ? ((foodRemaining - 1) * result.secondsPerFood + nextFoodCountdown) : 0;

  // ===== HANDLERS =====
  const addNarcotic = (amount) => {
    setTorporCurrent(prev => Math.min(result.maxTorpor, prev + amount));
  };

  const handleFoodTotalInput = (e) => {
    const raw = e.target.value;
    setFoodTotalInput(raw);
    const v = parseInt(raw);
    if (!isNaN(v) && v >= 1) {
      setFoodTotal(v);
      if (foodEaten > v) {
        setFoodEaten(v);
        setFoodEatenInput(String(v));
      }
    }
  };

  const handleFoodTotalBlur = () => {
    let v = parseInt(foodTotalInput);
    if (isNaN(v) || v < 1) v = 1;
    setFoodTotal(v);
    setFoodTotalInput(String(v));
  };

  const handleFoodEatenInput = (e) => {
    const raw = e.target.value;
    setFoodEatenInput(raw);
    const v = parseInt(raw);
    if (!isNaN(v) && v >= 0 && v <= foodTotal) {
      setFoodEaten(v);
      setNextFoodCountdown(result.secondsPerFood); // reset next food timer
    }
  };

  const handleFoodEatenBlur = () => {
    let v = parseInt(foodEatenInput);
    if (isNaN(v) || v < 0) v = 0;
    if (v > foodTotal) v = foodTotal;
    setFoodEaten(v);
    setFoodEatenInput(String(v));
  };

  const handleFoodEatenButton = (delta) => {
    setFoodEaten(prev => {
      const next = Math.max(0, Math.min(foodTotal, prev + delta));
      setFoodEatenInput(String(next));
      setNextFoodCountdown(result.secondsPerFood);
      return next;
    });
  };

  return (
    <div className="timers-section">
      {/* ===== TORPOR TIMER ===== */}
      <motion.div
        className="timer-card torpor-timer"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="timer-title">
          <span>💜</span> Timer Torpeur
        </div>

        <div className="timer-display">
          {formatTimerDisplay(torporSecondsLeft)}
        </div>

        <div className="timer-progress">
          <div className="timer-progress-bar" style={{ width: `${torporPercent}%` }} />
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          <span style={{ fontWeight: 600, color: torporWarning ? 'var(--warning)' : 'var(--torpor-color)' }}>
            {Math.round(torporCurrent).toLocaleString()}
          </span>
          {' / '}
          <span>{result.maxTorpor.toLocaleString()}</span>
          {' torpeur '}
          <span style={{ color: 'var(--text-muted)' }}>(-{result.torporDrainPerSec}/s)</span>
        </div>

        <div className="timer-controls">
          {!torporRunning ? (
            <button className="timer-btn primary" onClick={() => setTorporRunning(true)}>
              ▶ D&eacute;marrer
            </button>
          ) : (
            <button className="timer-btn" onClick={() => setTorporRunning(false)}>
              ⏸ Pause
            </button>
          )}
          <button className="timer-btn danger" onClick={() => { setTorporCurrent(result.maxTorpor); setTorporRunning(false); }}>
            ↺ Reset
          </button>
        </div>

        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button className="timer-btn" onClick={() => addNarcotic(40)} style={{ fontSize: '11px' }}>
            💊 +Narcotique (+40)
          </button>
          <button className="timer-btn" onClick={() => addNarcotic(7.5)} style={{ fontSize: '11px' }}>
            🫐 +Narcobaie (+7.5)
          </button>
          <button className="timer-btn" onClick={() => addNarcotic(80)} style={{ fontSize: '11px' }}>
            ☠️ +Bio Toxine (+80)
          </button>
        </div>

        {torporWarning && !torporDanger && (
          <motion.div className="timer-status warning" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            ⚠️ Torpeur basse ! Ajoutez des narcotiques !
          </motion.div>
        )}
        {torporDanger && (
          <motion.div className="timer-status warning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--danger)' }}>
            💀 Le dino va se r&eacute;veiller !
          </motion.div>
        )}
      </motion.div>

      {/* ===== FOOD TIMER ===== */}
      <motion.div
        className="timer-card food-timer"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="timer-title">
          <span>🍖</span> Timer Nourriture
        </div>

        {/* Main countdown: time until taming complete */}
        <div className="timer-display">
          {formatTimerDisplay(totalFoodTimeLeft)}
        </div>

        {/* Progress bar: based on food eaten */}
        <div className="timer-progress">
          <div className="timer-progress-bar" style={{ width: `${foodPercent}%` }} />
        </div>

        {/* Next food countdown */}
        {!tamingDone && foodRunning && (
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--food-color)', marginBottom: '8px' }}>
            Prochaine nourriture dans : {nextFoodCountdown}s
          </div>
        )}

        {/* ===== FOOD QUANTITY CONTROLS ===== */}
        <div className="timer-food-controls">
          {/* Total food */}
          <div className="timer-food-row">
            <span className="timer-food-label">{result.foodIcon} Total :</span>
            <button className="timer-food-btn" onClick={() => { const v = Math.max(1, foodTotal - 1); setFoodTotal(v); setFoodTotalInput(String(v)); }}>−</button>
            <input
              type="number"
              className="timer-food-input"
              value={foodTotalInput}
              min={1}
              onChange={handleFoodTotalInput}
              onBlur={handleFoodTotalBlur}
            />
            <button className="timer-food-btn" onClick={() => { const v = foodTotal + 1; setFoodTotal(v); setFoodTotalInput(String(v)); }}>+</button>
            <span className="timer-food-sub">{result.foodName}</span>
          </div>

          {/* Food eaten */}
          <div className="timer-food-row">
            <span className="timer-food-label">🍽️ Mang&eacute; :</span>
            <button className="timer-food-btn" onClick={() => handleFoodEatenButton(-1)}>−</button>
            <input
              type="number"
              className="timer-food-input"
              value={foodEatenInput}
              min={0}
              max={foodTotal}
              onChange={handleFoodEatenInput}
              onBlur={handleFoodEatenBlur}
            />
            <button className="timer-food-btn" onClick={() => handleFoodEatenButton(1)}>+</button>
            <span className="timer-food-sub">/ {foodTotal}</span>
          </div>

          {/* Remaining */}
          <div className="timer-food-row" style={{ justifyContent: 'center', gap: '12px', marginTop: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Restant : <strong style={{ color: 'var(--food-color)' }}>{foodRemaining}</strong>
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Intervalle : <strong style={{ color: 'var(--text-secondary)' }}>{result.secondsPerFood}s</strong>
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="timer-controls" style={{ marginTop: '12px' }}>
          {!foodRunning ? (
            <button className="timer-btn primary" onClick={() => { if (!tamingDone) setFoodRunning(true); }}>
              ▶ D&eacute;marrer
            </button>
          ) : (
            <button className="timer-btn" onClick={() => setFoodRunning(false)}>
              ⏸ Pause
            </button>
          )}
          <button className="timer-btn danger" onClick={() => {
            setFoodEaten(0);
            setFoodEatenInput('0');
            setNextFoodCountdown(result.secondsPerFood);
            setFoodRunning(false);
          }}>
            ↺ Reset
          </button>
        </div>

        {tamingDone && (
          <motion.div
            className="timer-status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: 'var(--success)', fontWeight: 600, marginTop: '8px' }}
          >
            ✅ Taming termin&eacute; !
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
