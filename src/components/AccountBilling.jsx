import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { buildLocalSyncSnapshot, calculateUsage, loadAccount, PLAN_CATALOG, saveAccount } from '../data/account';
import {
  getCloudAccount,
  loginCloudAccount,
  logoutCloudAccount,
  registerCloudAccount,
  createCheckoutSession,
  createCustomerPortal,
  getBackendConfig,
  syncSnapshot,
  updateCloudProfile,
} from '../data/cloudApi';
import {
  getCurrentSession,
  isSupabaseConfigured,
  onAuthStateChange,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  uploadProfileAvatar,
  upsertUserProfile,
} from '../data/supabaseClient';
import { CheckIcon, ClipboardIcon, ServerIcon, ShieldIcon, SparklesIcon, ZapIcon } from './Icons';

const PLATFORM_TRACKS = [
  {
    title: 'Web app',
    status: 'ready base',
    detail: 'Runs from browser, best target for cloud accounts, billing and tribe collaboration.',
  },
  {
    title: 'Desktop',
    status: 'active',
    detail: 'Electron remains the power-user build for overlay, OCR and local file workflows.',
  },
  {
    title: 'Mobile PWA',
    status: 'enabled',
    detail: 'Installable on Android and iOS from the browser, ready for timers and quick checks.',
  },
  {
    title: 'Native stores',
    status: 'later',
    detail: 'Android/iOS packaging can come after cloud sync and notifications are validated.',
  },
];

const PREMIUM_MODULES = [
  {
    title: 'Tribe Cloud Library',
    status: 'Core paid feature',
    value: 'Shared dino library, role-based access, conflict-safe cloud snapshots and backups.',
  },
  {
    title: 'Smart Breeding Planner',
    status: 'Premium workflow',
    value: 'Best-pair recommendations, mutation targets, clean-line filters and lineage history.',
  },
  {
    title: 'Mobile Timer Alerts',
    status: 'Retention driver',
    value: 'Imprint, maturation, starve and torpor reminders that follow the player off desktop.',
  },
  {
    title: 'Import Automation',
    status: 'Power-user value',
    value: 'Export-gun receiver, ASB imports, duplicate merge and tribe-safe change history.',
  },
  {
    title: 'Tribute & Boss Prep',
    status: 'Premium raid tool',
    value: 'Artifact, trophy and tribute checklists by map/difficulty with tribe assignments and run readiness.',
  },
];

const LAUNCH_CHECKLIST = [
  ['Cloud auth', 'Email/password accounts and persisted sessions'],
  ['Hosted tribe data', 'Shared tasks, boss prep and breeding snapshots'],
  ['Stripe webhooks', 'Required before taking real subscription money'],
  ['Cloud backup restore', 'Critical trust feature for paid users'],
  ['Mobile notifications', 'Main reason players keep subscription active'],
];

const DONATION_LINKS = [
  {
    id: 'paypal',
    label: 'PayPal.me',
    detail: 'A direct boost for hosting, imports and release builds.',
    url: import.meta.env?.VITE_DONATE_PAYPAL_URL || 'https://paypal.me/haitamhil',
  },
  {
    id: 'kofi',
    label: 'Ko-fi',
    detail: 'Quick tips that help ship polish, maps and quality-of-life updates.',
    url: import.meta.env?.VITE_DONATE_KOFI_URL || 'https://ko-fi.com/haitamhil3',
  },
  {
    id: 'coffee',
    label: 'Buy Me a Coffee',
    detail: 'Casual support to keep OVERSEER freemium for more survivors.',
    url: import.meta.env?.VITE_DONATE_COFFEE_URL || 'https://buymeacoffee.com/haylow',
  },
];

function Field({ label, children }) {
  return (
    <label className="account-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function PlanCard({ plan, active, onSelect }) {
  const features = [
    `${plan.libraryLimit.toLocaleString()} creatures`,
    `${plan.tribeSeats} seat${plan.tribeSeats > 1 ? 's' : ''}`,
    plan.cloudSync ? 'Cloud sync' : 'Local saves',
    plan.notifications ? 'Timer alerts' : 'Manual timers',
    plan.prioritySupport ? 'Priority support' : 'Community support',
  ];

  const recommended = plan.id === 'tribe';
  return (
    <button className={`account-plan ${active ? 'active' : ''}`} onClick={() => onSelect(plan.id)}>
      <div className="account-plan-top">
        <strong>{plan.name}</strong>
        <div>
          {recommended && <span>Best value</span>}
          {active && <span><CheckIcon size={12} /> Active</span>}
        </div>
      </div>
      <div className="account-price">
        <b>{plan.price}</b>
        <span>{plan.cadence}</span>
      </div>
      <div className="account-plan-features">
        {features.map(feature => <span key={feature}>{feature}</span>)}
      </div>
    </button>
  );
}

function ValueMetric({ label, value, note }) {
  return (
    <div className="account-value-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{note}</em>
    </div>
  );
}

export default function AccountBilling() {
  const [account, setAccount] = useState(loadAccount);
  const [authMode, setAuthMode] = useState('signin');
  const [password, setPassword] = useState('');
  const [sessionUser, setSessionUser] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const usage = useMemo(() => calculateUsage(account), [account]);
  const backend = useMemo(() => getBackendConfig(), []);
  const useCloudflareAuth = backend.configured && backend.authProvider !== 'supabase';
  const selectedPlan = PLAN_CATALOG[account.planId] || PLAN_CATALOG.free;
  const paidReadyScore = [
    Boolean(account.userId || account.email),
    isSupabaseConfigured || backend.configured,
    selectedPlan.id !== 'free',
    usage.libraryCount > 0,
    Boolean(account.tribeName),
  ].filter(Boolean).length;

  useEffect(() => {
    let alive = true;
    if (useCloudflareAuth) {
      getCloudAccount()
        .then(({ account: cloudAccount }) => {
          if (!alive || !cloudAccount) return;
          const next = saveAccount({
            ...loadAccount(),
            userId: cloudAccount.id,
            email: cloudAccount.email || '',
            displayName: cloudAccount.displayName || loadAccount().displayName,
            avatarUrl: cloudAccount.avatarUrl || loadAccount().avatarUrl,
            planId: cloudAccount.planId || loadAccount().planId,
            authProvider: 'cloudflare',
            billingStatus: cloudAccount.billingStatus || 'signed-in',
          });
          setSessionUser(cloudAccount);
          setAccount(next);
        })
        .catch(() => {});
      return () => {
        alive = false;
      };
    }

    getCurrentSession()
      .then(({ user }) => {
        if (!alive || !user) return;
        setSessionUser(user);
        const metadata = user.user_metadata || {};
        const next = saveAccount({
          ...loadAccount(),
          userId: user.id,
          email: user.email || '',
          displayName: metadata.display_name || loadAccount().displayName,
          avatarUrl: metadata.avatar_url || loadAccount().avatarUrl,
          tribeName: metadata.tribe_name || loadAccount().tribeName,
          authProvider: 'supabase',
          billingStatus: loadAccount().billingStatus === 'local-preview' ? 'signed-in' : loadAccount().billingStatus,
        });
        setAccount(next);
      })
      .catch(() => {});
    const unsubscribe = onAuthStateChange(({ user }) => {
      setSessionUser(user);
      if (!user) return;
      const metadata = user.user_metadata || {};
      const next = saveAccount({
        ...loadAccount(),
        userId: user.id,
        email: user.email || '',
        displayName: metadata.display_name || loadAccount().displayName,
        avatarUrl: metadata.avatar_url || loadAccount().avatarUrl,
        tribeName: metadata.tribe_name || loadAccount().tribeName,
        authProvider: 'supabase',
        billingStatus: loadAccount().billingStatus === 'local-preview' ? 'signed-in' : loadAccount().billingStatus,
      });
      setAccount(next);
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [useCloudflareAuth]);

  const updateAccount = (patch) => {
    const next = saveAccount({ ...account, ...patch });
    setAccount(next);
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setBusy('auth');
    setNotice('');
    try {
      if (!isSupabaseConfigured) {
        if (useCloudflareAuth) {
          const payload = {
            email: account.email.trim(),
            password,
            displayName: account.displayName.trim(),
            avatarUrl: account.avatarUrl,
          };
          const result = authMode === 'signup'
            ? await registerCloudAccount(payload)
            : await loginCloudAccount(payload);
          const cloudAccount = result.account;
          const next = saveAccount({
            ...account,
            userId: cloudAccount.id,
            email: cloudAccount.email,
            displayName: cloudAccount.displayName || account.displayName,
            avatarUrl: cloudAccount.avatarUrl || account.avatarUrl,
            planId: cloudAccount.planId || account.planId,
            authProvider: 'cloudflare',
            billingStatus: cloudAccount.billingStatus || 'signed-in',
          });
          setSessionUser(cloudAccount);
          setAccount(next);
          setNotice(authMode === 'signup' ? 'Compte Cloudflare cree et connecte.' : 'Connecte au cloud OVERSEER.');
          return;
        }

        const localUserId = `local-${crypto.randomUUID?.() || Date.now()}`;
        const next = saveAccount({
          ...account,
          userId: account.userId || localUserId,
          authProvider: 'local-dev',
          billingStatus: 'local-auth-ready',
        });
        setAccount(next);
        setNotice('Mode local actif. Ajoute VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY pour avoir une vraie inscription cloud.');
        return;
      }

      const payload = {
        email: account.email.trim(),
        password,
        displayName: account.displayName.trim(),
        tribeName: account.tribeName.trim(),
        avatarUrl: account.avatarUrl,
      };
      const result = authMode === 'signup'
        ? await signUpWithEmail(payload)
        : await signInWithEmail(payload);
      const user = result.user || result.session?.user;
      if (user) {
        await upsertUserProfile({
          userId: user.id,
          email: user.email,
          displayName: account.displayName,
          tribeName: account.tribeName,
          avatarUrl: account.avatarUrl,
        });
        updateAccount({
          userId: user.id,
          email: user.email || account.email,
          authProvider: 'supabase',
          billingStatus: authMode === 'signup' ? 'account-created' : 'signed-in',
        });
      }
      setNotice(authMode === 'signup' ? 'Compte cree. Verifie ton email si Supabase demande une confirmation.' : 'Connecte au cloud OVERSEER.');
    } catch (error) {
      setNotice(error.message || 'Auth failed.');
    } finally {
      setBusy('');
      setPassword('');
    }
  };

  const logout = async () => {
    setBusy('logout');
    try {
      if (useCloudflareAuth) await logoutCloudAccount();
      else await signOut();
      const next = saveAccount({ ...account, userId: '', authProvider: 'local', billingStatus: 'signed-out' });
      setSessionUser(null);
      setAccount(next);
      setNotice('Deconnecte.');
    } catch (error) {
      setNotice(error.message || 'Logout failed.');
    } finally {
      setBusy('');
    }
  };

  const changeAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy('avatar');
    setNotice('');
    try {
      let avatarUrl = '';
      if (useCloudflareAuth && account.userId) {
        avatarUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        await updateCloudProfile({ displayName: account.displayName, avatarUrl });
        setNotice('Avatar sauvegarde sur le profil cloud.');
      } else if (isSupabaseConfigured && account.userId) {
        avatarUrl = await uploadProfileAvatar({ userId: account.userId, file });
        await upsertUserProfile({
          userId: account.userId,
          email: account.email,
          displayName: account.displayName,
          tribeName: account.tribeName,
          avatarUrl,
        });
        setNotice('Avatar uploadé sur le cloud.');
      } else {
        avatarUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        setNotice('Avatar gardé en local. Il sera uploadé quand le cloud sera configuré.');
      }
      updateAccount({ avatarUrl });
    } catch (error) {
      setNotice(error.message || 'Avatar upload failed.');
    } finally {
      setBusy('');
      event.target.value = '';
    }
  };

  const exportSnapshot = async () => {
    const snapshot = buildLocalSyncSnapshot(account);
    const text = JSON.stringify(snapshot, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setNotice('Local cloud snapshot copied. This is the payload the backend will sync.');
    } catch {
      setNotice('Clipboard blocked. Snapshot prepared but not copied.');
    }
  };

  const syncNow = async () => {
    setBusy('sync');
    setNotice('');
    try {
      const result = await syncSnapshot(buildLocalSyncSnapshot(account));
      const syncedAt = result.syncedAt || new Date().toISOString();
      updateAccount({ lastSyncAt: syncedAt, billingStatus: account.billingStatus === 'local-preview' ? 'cloud-ready' : account.billingStatus });
      setNotice('Cloud sync snapshot sent successfully.');
    } catch (error) {
      setNotice(error.message || 'Cloud sync failed.');
    } finally {
      setBusy('');
    }
  };

  const startCheckout = async () => {
    if (account.planId === 'free') {
      setNotice('Choose Survivor or Tribe before starting checkout.');
      return;
    }
    setBusy('checkout');
    setNotice('');
    try {
      const result = await createCheckoutSession({
        planId: account.planId,
        account,
        successUrl: `${window.location.origin}${window.location.pathname}#account:success`,
        cancelUrl: `${window.location.origin}${window.location.pathname}#account`,
      });
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      setNotice('Checkout session created, but backend did not return a url.');
    } catch (error) {
      setNotice(error.message || 'Checkout failed.');
    } finally {
      setBusy('');
    }
  };

  const openPortal = async () => {
    setBusy('portal');
    setNotice('');
    try {
      const result = await createCustomerPortal({
        account,
        returnUrl: `${window.location.origin}${window.location.pathname}#account`,
      });
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      setNotice('Portal session created, but backend did not return a url.');
    } catch (error) {
      setNotice(error.message || 'Customer portal failed.');
    } finally {
      setBusy('');
    }
  };

  const openDonation = async (url) => {
    if (!url) {
      setNotice('Ajoute ton lien de donation dans .env.local pour activer ce bouton.');
      return;
    }
    try {
      if (window.api?.openExternalUrl) {
        const result = await window.api.openExternalUrl(url);
        if (result?.ok) return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setNotice('Impossible d ouvrir le lien automatiquement. Copie le lien depuis le bouton.');
    }
  };

  const isSignedIn = Boolean(sessionUser || account.userId);

  return (
    <motion.div
      className="account-page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
    >
      <section className="account-hero">
        <div>
          <span className="account-eyebrow"><SparklesIcon size={14} /> Account</span>
          <h1>OVERSEER profile</h1>
          <p>Manage your player profile, avatar, login and cloud sync settings.</p>
        </div>
        <div className="account-status">
          <span>Access</span>
          <strong>Free</strong>
          <em>{sessionUser || account.userId ? 'signed in' : 'not signed in'}</em>
        </div>
      </section>

      <section className="account-grid">
        <div className="account-panel">
          <div className="account-panel-title">
            <div><ShieldIcon size={15} /> Account Login</div>
            <span>{sessionUser || account.userId ? 'signed in' : useCloudflareAuth ? 'cloudflare auth' : isSupabaseConfigured ? 'cloud auth' : 'local fallback'}</span>
          </div>
          <div className="account-profile-strip">
            <div className="account-avatar">
              {account.avatarUrl ? <img src={account.avatarUrl} alt="" /> : <span>{(account.displayName || account.email || 'OV').slice(0, 2).toUpperCase()}</span>}
            </div>
            <div>
              <strong>{account.displayName || 'Survivor profile'}</strong>
              <span>{account.email || 'No account email yet'}</span>
            </div>
            <label className="account-avatar-upload">
              {busy === 'avatar' ? 'Uploading...' : 'Avatar'}
              <input type="file" accept="image/*" onChange={changeAvatar} />
            </label>
          </div>
          {isSignedIn ? (
            <div className="account-signed-panel">
              <div className="account-signed-copy">
                <strong>Compte connecte</strong>
                <span>{account.email || 'Session active'} · {useCloudflareAuth ? 'Cloudflare sync' : isSupabaseConfigured ? 'Supabase sync' : 'Local profile'}</span>
              </div>
              <div className="account-form account-form-compact">
                <Field label="Display name">
                  <input value={account.displayName} onChange={event => updateAccount({ displayName: event.target.value })} placeholder="Breeder name" />
                </Field>
                <Field label="Email">
                  <input value={account.email} onChange={event => updateAccount({ email: event.target.value })} placeholder="you@tribe.gg" />
                </Field>
              </div>
              <div className="account-inline-actions">
                <button className="account-primary" type="button" onClick={syncNow} disabled={busy === 'sync'}><ZapIcon size={14} /> {busy === 'sync' ? 'Syncing...' : 'Sync profile'}</button>
                <button className="account-secondary" type="button" onClick={logout} disabled={busy === 'logout'}>Logout</button>
              </div>
            </div>
          ) : (
            <form className="account-form" onSubmit={submitAuth}>
              <div className="account-auth-tabs">
                <button type="button" className={authMode === 'signin' ? 'active' : ''} onClick={() => setAuthMode('signin')}>Login</button>
                <button type="button" className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>Inscription</button>
              </div>
              <Field label="Email">
                <input value={account.email} onChange={event => updateAccount({ email: event.target.value })} placeholder="you@tribe.gg" />
              </Field>
              <Field label="Display name">
                <input value={account.displayName} onChange={event => updateAccount({ displayName: event.target.value })} placeholder="Breeder name" />
              </Field>
              <Field label="Password">
                <input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder={(isSupabaseConfigured || useCloudflareAuth) ? '8+ characters' : 'local mode ignores password'} />
              </Field>
              <div className="account-inline-actions">
                <button className="account-primary" type="submit" disabled={busy === 'auth'}><ShieldIcon size={14} /> {busy === 'auth' ? 'Working...' : authMode === 'signup' ? 'Create account' : 'Login'}</button>
              </div>
            </form>
          )}
        </div>

      </section>

      {notice && <section className="account-notice">{notice}</section>}

      <section className="account-panel">
        <div className="account-panel-title">
          <div><ServerIcon size={15} /> Data & Backup</div>
          <span>{useCloudflareAuth ? 'cloudflare ready' : isSupabaseConfigured ? 'cloud available' : 'local mode'}</span>
        </div>
        <div className="account-usage">
          <div>
            <span>Creature library</span>
            <strong>{usage.libraryCount} saved</strong>
          </div>
          <div className="account-meter"><i style={{ width: `${usage.libraryPct}%` }} /></div>
          <div className="account-sync-list">
            <span><CheckIcon size={12} /> Profile settings</span>
            <span><CheckIcon size={12} /> Creature library</span>
            <span><CheckIcon size={12} /> Raising timers</span>
            <span className={account.tribeCode ? 'ready' : ''}><CheckIcon size={12} /> Cloud account link</span>
          </div>
          <div className="account-inline-actions">
            <button className="account-primary" onClick={syncNow} disabled={busy === 'sync'}><ZapIcon size={14} /> {busy === 'sync' ? 'Syncing...' : 'Sync now'}</button>
            <button className="account-secondary" onClick={exportSnapshot}><ClipboardIcon size={14} /> Copy backup</button>
          </div>
        </div>
      </section>

      <section className="account-panel">
        <div className="account-panel-title">
          <div><SparklesIcon size={15} /> Support OVERSEER</div>
          <span>freemium launch</span>
        </div>
        <div className="account-donation-panel">
          <div className="account-donation-copy">
            <strong>Help keep OVERSEER fast, free and constantly improving.</strong>
            <p>Your support pays for hosting, data sync, creature imports, map assets and the long polish pass that makes the app feel premium.</p>
          </div>
          <div className="account-donation-links">
            {DONATION_LINKS.map(link => (
              <button
                key={link.id}
                className={link.url ? 'ready' : ''}
                onClick={() => openDonation(link.url)}
              >
                <span>{link.label}</span>
                <em>{link.url ? 'Open donation link' : 'Link not configured'}</em>
                <small>{link.detail}</small>
              </button>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
