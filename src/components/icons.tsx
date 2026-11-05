// Pictogrammes au trait (24 px), hérités de la couleur du texte
type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24", "aria-hidden": true };

export const IconCart = ({ className }: P) => (<svg {...base} className={className}><path d="M3 4h2.2l2.1 10.2a1.6 1.6 0 0 0 1.6 1.3h8.5a1.6 1.6 0 0 0 1.6-1.2L20.5 8H6.1" /><circle cx="9.5" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></svg>);
export const IconSearch = ({ className }: P) => (<svg {...base} className={className}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>);
export const IconTruck = ({ className }: P) => (<svg {...base} className={className}><path d="M3 6.5h11v9.5H3zM14 9.5h3.8l3.2 3.4v3.1h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17.5" cy="17.5" r="1.8" /></svg>);
export const IconWallet = ({ className }: P) => (<svg {...base} className={className}><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" /><rect x="4" y="8" width="16.5" height="11" rx="2.5" /><circle cx="16.5" cy="13.5" r="1.2" fill="currentColor" stroke="none" /></svg>);
export const IconPhone = ({ className }: P) => (<svg {...base} className={className}><rect x="6.5" y="2.8" width="11" height="18.4" rx="2.6" /><path d="M10.5 17.8h3" /></svg>);
export const IconClock = ({ className }: P) => (<svg {...base} className={className}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>);
export const IconPin = ({ className }: P) => (<svg {...base} className={className}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);
export const IconCheck = ({ className }: P) => (<svg {...base} className={className}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>);
export const IconClose = ({ className }: P) => (<svg {...base} className={className}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const IconPlus = ({ className }: P) => (<svg {...base} className={className}><path d="M12 5v14M5 12h14" /></svg>);
export const IconMinus = ({ className }: P) => (<svg {...base} className={className}><path d="M5 12h14" /></svg>);
export const IconArrow = ({ className }: P) => (<svg {...base} className={className}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const IconReceipt = ({ className }: P) => (<svg {...base} className={className}><path d="M6 3.5h12v17l-2.4-1.6-2.4 1.6-2.4-1.6-2.4 1.6L6 20.5z" /><path d="M9 8.5h6M9 12h6M9 15.5h3.5" /></svg>);
export const IconTrash = ({ className }: P) => (<svg {...base} className={className}><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12.5h9.4L17.5 7" /></svg>);

// Rayons
export const IconLeaf = ({ className }: P) => (<svg {...base} className={className}><path d="M5 19c0-8 5-13 14-14-.5 9-5.5 14-13 14z" /><path d="M5 19l7-7" /></svg>);
export const IconJar = ({ className }: P) => (<svg {...base} className={className}><path d="M8 3.5h8v3H8z" /><path d="M7 6.5h10a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V8A1.5 1.5 0 0 1 7 6.5z" /><path d="M5.5 11h13M5.5 16h13" /></svg>);
export const IconCandy = ({ className }: P) => (<svg {...base} className={className}><circle cx="12" cy="12" r="4.5" /><path d="M8.8 8.8L5.5 5.5 3 7l2.5 1M15.2 15.2l3.3 3.3L21 17l-2.5-1" /></svg>);
export const IconSnow = ({ className }: P) => (<svg {...base} className={className}><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5" /></svg>);
export const IconBottle = ({ className }: P) => (<svg {...base} className={className}><path d="M10 2.5h4v3l1.8 2.6a3 3 0 0 1 .5 1.7V20a1.5 1.5 0 0 1-1.5 1.5H9.2A1.5 1.5 0 0 1 7.7 20V9.8a3 3 0 0 1 .5-1.7L10 5.5z" /><path d="M7.7 12.5h8.6" /></svg>);
export const IconSpray = ({ className }: P) => (<svg {...base} className={className}><path d="M8 8.5h6v12.5H8z" /><path d="M9.5 8.5V5.5h3l2.5 1.5" /><path d="M18 4.5v.01M20 6.5v.01M18 8.5v.01" /></svg>);

// Réseaux sociaux (formes pleines)
export const IconFacebook = ({ className }: P) => (<svg viewBox="0 0 24 24" aria-hidden className={className}><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4A21 21 0 0 0 14.3 4c-2.3 0-3.8 1.4-3.8 3.9v2.6H8v3h2.5V21z" /></svg>);
export const IconInstagram = ({ className }: P) => (<svg {...base} className={className}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" /></svg>);
export const IconTiktok = ({ className }: P) => (<svg viewBox="0 0 24 24" aria-hidden className={className}><path fill="currentColor" d="M16.6 3c.3 2.2 1.6 3.6 3.9 3.8v2.6a6.6 6.6 0 0 1-3.9-1.3v5.8c0 3.6-2.7 5.9-5.9 5.9a5.8 5.8 0 0 1-5.8-5.9c0-3.5 3-6.1 6.6-5.7v2.8c-1.8-.4-3.6.7-3.6 2.9 0 1.6 1.2 2.9 2.9 2.9 1.8 0 2.9-1.2 2.9-3.1V3z" /></svg>);
export const IconWhatsapp = ({ className }: P) => (<svg viewBox="0 0 24 24" aria-hidden className={className}><path fill="currentColor" d="M12 2.5a9.4 9.4 0 0 0-8.1 14.2L2.6 21.5l4.9-1.3A9.4 9.4 0 1 0 12 2.5zm0 17.1a7.7 7.7 0 0 1-3.9-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A7.7 7.7 0 1 1 12 19.6zm4.2-5.8c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.3 6.3 0 0 1-3.1-2.7c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3z" /></svg>);
