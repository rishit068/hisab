interface CategoryIconProps {
  name?: string | null;
  className?: string;
  size?: number;
}

export function CategoryIcon({ name = '', className = '', size = 20 }: CategoryIconProps) {
  const norm = (name || '').toLowerCase().trim();

  // Groceries / Food / Ration
  if (norm.includes('grocer') || norm.includes('vegetable') || norm.includes('market') || norm.includes('ration')) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center shrink-0 bg-[#FEF3C7] text-[#92400E] ${className}`}
        style={{ width: size * 2, height: size * 2 }}
        aria-hidden="true"
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      </div>
    );
  }

  // Dining / Hotel / Food
  if (norm.includes('din') || norm.includes('restaurant') || norm.includes('food') || norm.includes('hotel') || norm.includes('tea') || norm.includes('chai')) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center shrink-0 bg-[#FFEDD5] text-[#C2410C] ${className}`}
        style={{ width: size * 2, height: size * 2 }}
        aria-hidden="true"
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      </div>
    );
  }

  // Medicine / Health / Doctor
  if (norm.includes('medic') || norm.includes('health') || norm.includes('doctor') || norm.includes('pharmacy')) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center shrink-0 bg-[#FEE2E2] text-[#991B1B] ${className}`}
        style={{ width: size * 2, height: size * 2 }}
        aria-hidden="true"
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
          <path d="m8.5 8.5 7 7" />
        </svg>
      </div>
    );
  }

  // Electricity / Power / Light
  if (norm.includes('elect') || norm.includes('power') || norm.includes('light') || norm.includes('bill')) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center shrink-0 bg-[#FEF9C3] text-[#854D0E] ${className}`}
        style={{ width: size * 2, height: size * 2 }}
        aria-hidden="true"
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </div>
    );
  }

  // Water / Drink
  if (norm.includes('water') || norm.includes('pani')) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center shrink-0 bg-[#E0F2FE] text-[#0369A1] ${className}`}
        style={{ width: size * 2, height: size * 2 }}
        aria-hidden="true"
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      </div>
    );
  }

  // Fuel / Petrol / Diesel
  if (norm.includes('fuel') || norm.includes('petrol') || norm.includes('diesel')) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center shrink-0 bg-[#F1F5F9] text-[#334155] ${className}`}
        style={{ width: size * 2, height: size * 2 }}
        aria-hidden="true"
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 22h12" />
          <path d="M4 9h10" />
          <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
          <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
        </svg>
      </div>
    );
  }

  // Gas / Cylinder
  if (norm.includes('gas') || norm.includes('cylinder') || norm.includes('lpg')) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center shrink-0 bg-[#FED7AA] text-[#9A3412] ${className}`}
        style={{ width: size * 2, height: size * 2 }}
        aria-hidden="true"
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z" />
        </svg>
      </div>
    );
  }

  // Rent / House / Maintenance
  if (norm.includes('rent') || norm.includes('house') || norm.includes('room') || norm.includes('maint')) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center shrink-0 bg-[#EDE9FE] text-[#5B21B6] ${className}`}
        style={{ width: size * 2, height: size * 2 }}
        aria-hidden="true"
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
    );
  }

  // Travel / Taxi / Train / Auto
  if (norm.includes('travel') || norm.includes('auto') || norm.includes('taxi') || norm.includes('cab') || norm.includes('train') || norm.includes('bus')) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center shrink-0 bg-[#DCFCE7] text-[#166534] ${className}`}
        style={{ width: size * 2, height: size * 2 }}
        aria-hidden="true"
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="7.5" cy="16.5" r="1.5" />
          <circle cx="16.5" cy="16.5" r="1.5" />
          <path d="M3 11h18" />
        </svg>
      </div>
    );
  }

  // Default fallback (receipt / tag)
  return (
    <div
      className={`rounded-2xl flex items-center justify-center shrink-0 bg-[#EEF6F6] text-[var(--primary)] ${className}`}
      style={{ width: size * 2, height: size * 2 }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
        <path d="M8 7h8" />
        <path d="M8 11h8" />
        <path d="M8 15h4" />
      </svg>
    </div>
  );
}
