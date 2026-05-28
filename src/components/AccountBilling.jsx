import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { buildLocalSyncSnapshot, calculateUsage, loadAccount, PLAN_CATALOG, saveAccount } from '../data/account';
import { createCheckoutSession, createCustomerPortal, getBackendConfig, syncSnapshot } from '../data/cloudApi';
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
import { createHostedTribe, joinHostedTribe } from '../data/tribeCloud';
import { CheckIcon, ClipboardIcon, DnaIcon, PlusIcon, ServerIcon, ShieldIcon, SparklesIcon, ZapIcon } from './Icons';

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
  ['Supabase auth', 'Email/password accounts and persisted sessions'],
  ['Hosted tribe data', 'Shared tasks, boss prep and breeding snapshots'],
  ['Stripe webhooks', 'Required before taking real subscription money'],
  ['Cloud backup restore', 'Critical trust feature for paid users'],
  ['Mobile notifications', 'Main reason players keep subscription active'],
];

const DONATION_LINKS = [
  {
    id: 'paypal',
    label: 'PayPal.me',
    detail: 'One-time support for server costs and development time.',
    url: import.meta.env?.VITE_DONATE_PAYPAL_URL || '',
  },
  {
    id: 'kofi',
    label: 'Ko-fi',
    detail: 'Small tips from players who want the app to keep improving.',
    url: import.meta.env?.VITE_DONATE_KOFI_URL || '',
  },
  {
    id: 'coffee',
    label: 'Buy Me a Coffee',
    detail: 'Casual support while OVERSEER stays freemium.',
    url: import.meta.env?.VITE_DONATE_COFFEE_URL || '',
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
  const [inviteCode, setInviteCode] = useState('');
  const [sessionUser, setSessionUser] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const usage = useMemo(() => calculateUsage(account), [account]);
  const backend = useMemo(() => getBackendConfig(), []);
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
  }, []);

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
      await signOut();
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
      if (isSupabaseConfigured && account.userId) {
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
        setNotice('Avatar gardé en local. Il sera uploadé quand Supabase sera configuré.');
      }
      updateAccount({ avatarUrl });
    } catch (error) {
      setNotice(error.message || 'Avatar upload failed.');
    } finally {
      setBusy('');
      event.target.value = '';
    }
  };

  const createTribe = async () => {
    if (isSupabaseConfigured && !account.userId) {
      setNotice('Connecte-toi avant de creer une tribu cloud.');
      return;
    }
    if (!account.tribeName.trim()) {
      setNotice('Entre un nom de tribu avant de creer le workspace.');
      return;
    }
    setBusy('tribe-create');
    setNotice('');
    try {
      const tribe = await createHostedTribe({
        name: account.tribeName.trim(),
        ownerId: account.userId,
        ownerName: account.displayName || account.email,
      });
      updateAccount({
        tribeName: tribe.name || tribe.tribeName || account.tribeName,
        tribeCode: tribe.invite_code || tribe.tribeCode || account.tribeCode,
        hostedTribeId: tribe.id || account.hostedTribeId,
        billingStatus: isSupabaseConfigured ? 'tribe-hosted' : 'local-tribe-ready',
      });
      setNotice(isSupabaseConfigured ? 'Tribu cloud creee.' : 'Tribu creee en mode local. Elle sera hostee quand Supabase sera configure.');
    } catch (error) {
      setNotice(error.message || 'Impossible de creer la tribu.');
    } finally {
      setBusy('');
    }
  };

  const joinTribe = async () => {
    if (!inviteCode.trim()) return;
    if (isSupabaseConfigured && !account.userId) {
      setNotice('Connecte-toi avant de rejoindre une tribu cloud.');
      return;
    }
    setBusy('tribe-join');
    setNotice('');
    try {
      const tribe = await joinHostedTribe({
        inviteCode,
        userId: account.userId,
        displayName: account.displayName || account.email,
      });
      updateAccount({
        tribeName: tribe.name || account.tribeName,
        tribeCode: tribe.invite_code || tribe.tribeCode || inviteCode.toUpperCase(),
        hostedTribeId: tribe.id || account.hostedTribeId,
        billingStatus: isSupabaseConfigured ? 'tribe-joined' : 'local-join-ready',
      });
      setNotice('Tribu liee au compte.');
      setInviteCode('');
    } catch (error) {
      setNotice(error.message || 'Invite code invalide.');
    } finally {
      setBusy('');
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

  const openDonation = (url) => {
    if (!url) {
      setNotice('Ajoute ton lien de donation dans .env.local pour activer ce bouton.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
          <p>Manage your player profile, tribe workspace, avatar and cloud sync settings.</p>
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
            <span>{sessionUser || account.userId ? 'signed in' : isSupabaseConfigured ? 'cloud auth' : 'local fallback'}</span>
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
              <input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder={isSupabaseConfigured ? '8+ characters' : 'local mode ignores password'} />
            </Field>
            <div className="account-inline-actions">
              <button className="account-primary" type="submit" disabled={busy === 'auth'}><ShieldIcon size={14} /> {busy === 'auth' ? 'Working...' : authMode === 'signup' ? 'Create account' : 'Login'}</button>
              <button className="account-secondary" type="button" onClick={logout} disabled={busy === 'logout' || (!sessionUser && !account.userId)}>Logout</button>
            </div>
          </form>
        </div>

        <div className="account-panel">
          <div className="account-panel-title">
            <div><ServerIcon size={15} /> Hosted Tribe Data</div>
            <span>{account.hostedTribeId ? 'hosted' : account.tribeCode ? 'linked' : 'not linked'}</span>
          </div>
          <div className="account-usage">
            <Field label="Tribe name">
              <input value={account.tribeName} onChange={event => updateAccount({ tribeName: event.target.value })} placeholder="Les Raptors" />
            </Field>
            <Field label="Invite code">
              <input value={inviteCode} onChange={event => setInviteCode(event.target.value.toUpperCase())} placeholder={account.tribeCode || 'TRIBE-XXXX'} />
            </Field>
            <div className="account-inline-actions">
              <button className="account-primary" onClick={createTribe} disabled={busy === 'tribe-create'}><PlusIcon size={14} /> {busy === 'tribe-create' ? 'Creating...' : 'Create tribe'}</button>
              <button className="account-secondary" onClick={joinTribe} disabled={busy === 'tribe-join'}>Join code</button>
            </div>
            {account.tribeCode && <div className="account-cloud-badge">Invite: <strong>{account.tribeCode}</strong></div>}
          </div>
        </div>
      </section>

      {notice && <section className="account-notice">{notice}</section>}

      <section className="account-panel">
        <div className="account-panel-title">
          <div><ServerIcon size={15} /> Data & Backup</div>
          <span>{isSupabaseConfigured ? 'cloud available' : 'local mode'}</span>
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
            <span className={account.tribeCode ? 'ready' : ''}><CheckIcon size={12} /> Tribe workspace</span>
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
            <strong>OVERSEER stays free while the cloud foundation grows.</strong>
            <p>Players can support hosting, data imports, maps, timers and tribe sync without forcing subscriptions on day one.</p>
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
