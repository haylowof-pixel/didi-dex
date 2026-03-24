import React from 'react';

// Reusable SVG icon component - all icons from Lucide/custom
const I = ({ d, size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>{d}</svg>
);

// ─── App ───
export const LogoIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  </svg>
);

// ─── Navigation / Tools ───
export const CalculatorIcon = ({ size = 16 }) => <I size={size} d={<>
  <rect x="4" y="2" width="16" height="20" rx="2"/>
  <path d="M8 6h8M8 10h8M8 14h4M8 18h4M16 14v4"/>
</>}/>;

export const DnaIcon = ({ size = 16 }) => <I size={size} d={<>
  <path d="M2 15c6.667-6 13.333 0 20-6"/>
  <path d="M9 3.236s1.612 2.164 3.5 3.264M5.5 9.5c1.667.333 3.333.333 5 0M6 16.5c2-.333 4-.333 6 0M14.5 20.764s-1.612-2.164-3.5-3.264"/>
</>}/>;

export const TimerIcon = ({ size = 16 }) => <I size={size} d={<>
  <circle cx="12" cy="13" r="8"/>
  <path d="M12 9v4l2 2M5 3l2 2M19 3l-2 2M12 3v2"/>
</>}/>;

export const MapIcon = ({ size = 16 }) => <I size={size} d={<>
  <path d="m3 7 6-3 6 3 6-3v13l-6 3-6-3-6 3z"/>
  <path d="M9 4v13M15 7v13"/>
</>}/>;

export const ScanIcon = ({ size = 16 }) => <I size={size} d={<>
  <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
  <path d="M7 12h10M12 7v10"/>
</>}/>;

export const WidgetIcon = ({ size = 16 }) => <I size={size} d={<>
  <rect x="3" y="3" width="7" height="7" rx="1"/>
  <rect x="14" y="3" width="7" height="7" rx="1"/>
  <rect x="3" y="14" width="7" height="7" rx="1"/>
  <rect x="14" y="14" width="7" height="7" rx="1"/>
</>}/>;

export const SettingsIcon = ({ size = 16 }) => <I size={size} d={<>
  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
  <circle cx="12" cy="12" r="3"/>
</>}/>;

export const LayersIcon = ({ size = 16 }) => <I size={size} d={<>
  <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>
  <path d="m22 12-8.58 3.91a2 2 0 0 1-1.66 0L2 12"/>
  <path d="m22 17-8.58 3.91a2 2 0 0 1-1.66 0L2 17"/>
</>}/>;

// ─── Actions ───
export const PlayIcon = ({ size = 16 }) => <I size={size} d={<polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none"/>}/>;

export const PauseIcon = ({ size = 16 }) => <I size={size} d={<>
  <rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" rx="1"/>
  <rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" rx="1"/>
</>}/>;

export const ResetIcon = ({ size = 16 }) => <I size={size} d={<>
  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
  <path d="M3 3v5h5"/>
</>}/>;

export const PlusIcon = ({ size = 16 }) => <I size={size} d={<><path d="M5 12h14"/><path d="M12 5v14"/></>}/>;

// ─── Info / Status ───
export const ClockIcon = ({ size = 16 }) => <I size={size} d={<><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>}/>;

export const HeartIcon = ({ size = 16 }) => <I size={size} d={
  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
}/>;

export const ZapIcon = ({ size = 16 }) => <I size={size} d={
  <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
}/>;

export const ShieldIcon = ({ size = 16 }) => <I size={size} d={
  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
}/>;

export const DropletIcon = ({ size = 16 }) => <I size={size} d={
  <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
}/>;

export const AlertIcon = ({ size = 16 }) => <I size={size} d={<>
  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
  <path d="M12 9v4M12 17h.01"/>
</>}/>;

export const SparklesIcon = ({ size = 16 }) => <I size={size} d={<>
  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
  <path d="M20 3v4M22 5h-4"/>
</>}/>;

export const InfoIcon = ({ size = 16 }) => <I size={size} d={<><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></>}/>;

export const PillIcon = ({ size = 16 }) => <I size={size} d={
  <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7ZM8.5 8.5l7 7"/>
}/>;

export const SkullIcon = ({ size = 16 }) => <I size={size} d={<>
  <circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/>
  <path d="M8 20v2h8v-2M12.5 17l-.5-1-.5 1h1z"/>
  <path d="M17 22H7a5 5 0 0 1 0-10h.1A8 8 0 1 1 21 12a4 4 0 0 1-4 4"/>
</>}/>;

export const ClipboardIcon = ({ size = 16 }) => <I size={size} d={<>
  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
  <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>
</>}/>;

// ─── Task Category Icons ───
export const FarmingIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22V10"/>
    <path d="M6 18c0-3.5 2.5-6 6-8"/>
    <path d="M18 18c0-3.5-2.5-6-6-8"/>
    <path d="M12 10c-2-2.5-2-5 0-8"/>
    <path d="M8 14c-2-1-4-.5-5 1"/>
    <path d="M16 14c2-1 4-.5 5 1"/>
  </svg>
);

export const TamingLassoIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="10" rx="8" ry="6"/>
    <path d="M18 14c0 2-1.5 4-3 5"/>
    <path d="M15 19c-.5 1-1.5 2-3 3"/>
    <circle cx="12" cy="10" r="2"/>
  </svg>
);

export const BuildingIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2l5 5-11 11H4v-5L15 2z"/>
    <path d="M12 5l5 5"/>
    <path d="M2 22h20"/>
  </svg>
);

export const RaidIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2l5.5 5.5-7 7-5.5-5.5z"/>
    <path d="M9.5 14.5l-5.5 5.5"/>
    <path d="M3 21l1-1"/>
    <path d="M9.5 2l5.5 5.5"/>
    <path d="M14.5 9.5l5.5 5.5-2 2"/>
    <path d="M2 9.5l5.5 5.5"/>
  </svg>
);

export const TaskClipboardIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <path d="M9 14l2 2 4-4"/>
  </svg>
);

export const CheckIcon = ({ size = 16 }) => <I size={size} d={<path d="M20 6L9 17l-5-5"/>}/>;
