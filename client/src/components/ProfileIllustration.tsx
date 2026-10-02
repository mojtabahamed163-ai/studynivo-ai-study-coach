export function ProfileIllustration() {
  return (
    <div className="profile-illustration" aria-hidden="true">
      <svg viewBox="0 0 420 220" role="img" aria-label="Student studying at a desk">
        <defs>
          <linearGradient id="studyDesk" x1="0" x2="1">
            <stop offset="0" stopColor="#0f766e" />
            <stop offset="1" stopColor="#18a294" />
          </linearGradient>
          <linearGradient id="studyScreen" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#eaf8f4" />
            <stop offset="1" stopColor="#c6ebe3" />
          </linearGradient>
        </defs>
        <circle cx="335" cy="48" r="30" fill="#fff3d8" />
        <circle cx="335" cy="48" r="16" fill="#f2c768" />
        <path d="M40 182h340" stroke="#aacfc5" strokeWidth="8" strokeLinecap="round" />
        <path d="M70 188v24M350 188v24" stroke="#7eaea3" strokeWidth="7" strokeLinecap="round" />
        <rect x="78" y="151" width="72" height="23" rx="5" fill="#fff" stroke="#b8ddd4" strokeWidth="3" transform="rotate(-7 78 151)" />
        <path d="M91 158h40M88 166h28" stroke="#78b8aa" strokeWidth="3" strokeLinecap="round" />
        <rect x="262" y="150" width="42" height="26" rx="7" fill="#f6c98a" />
        <path d="M276 149c0-15 14-18 20-3" fill="none" stroke="#d88957" strokeWidth="4" strokeLinecap="round" />
        <circle cx="201" cy="79" r="23" fill="#f0b58c" />
        <path d="M178 75c3-28 45-32 51 2-14-9-32-10-51-2Z" fill="#263e49" />
        <path d="M172 112c12-12 46-14 59 0l20 46h-94Z" fill="url(#studyDesk)" />
        <path d="M185 117l-18 34M219 117l18 34" stroke="#f0b58c" strokeWidth="10" strokeLinecap="round" />
        <path d="M174 153h-22M238 153h24" stroke="#263e49" strokeWidth="9" strokeLinecap="round" />
        <path d="M159 144h89l-12 37h-66Z" fill="#dcefeb" stroke="#88c2b6" strokeWidth="3" />
        <rect x="174" y="118" width="60" height="40" rx="5" fill="#233d49" transform="rotate(-3 174 118)" />
        <rect x="180" y="123" width="48" height="29" rx="3" fill="url(#studyScreen)" transform="rotate(-3 180 123)" />
        <path d="M188 141l8-7 6 4 10-10" fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="213" cy="132" r="3" fill="#e8a64d" />
        <path d="M107 72v14M100 79h14M305 97v12M299 103h12" stroke="#e5a742" strokeWidth="4" strokeLinecap="round" />
        <path d="M52 112h36M52 121h25" stroke="#b7d8ce" strokeWidth="5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
