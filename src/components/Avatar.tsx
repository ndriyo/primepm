import { useState } from 'react';

export interface AvatarProps {
  url: string | null | undefined;
  name: string | null | undefined;
  email: string | null | undefined;
  size?: number;
  className?: string;
}

function deriveInitials(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  if (name) {
    const tokens = name.trim().split(/\s+/).filter(Boolean);
    if (tokens.length >= 2) return (tokens[0][0] + tokens[1][0]).toUpperCase();
    if (tokens.length === 1 && tokens[0].length > 0) return tokens[0][0].toUpperCase();
  }
  if (email) {
    const local = email.split('@')[0] ?? '';
    const parts = local.split(/[._-]/).filter(Boolean);
    const joined = parts.map(p => p[0]?.toUpperCase() ?? '').join('').slice(0, 2);
    if (joined) return joined;
    if (local.length > 0) return local[0].toUpperCase();
  }
  return 'U';
}

export function Avatar({ url, name, email, size = 32, className }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = Boolean(url) && !errored;
  const initials = deriveInitials(name, email);
  const altText = name ?? email ?? 'User';

  if (showImage) {
    return (
      <img
        className={`pp-avatar pp-avatar-img ${className ?? ''}`.trim()}
        src={url as string}
        alt={altText}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <div
      className={`pp-avatar ${className ?? ''}`.trim()}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }}
      aria-label={altText}
    >
      {initials}
    </div>
  );
}
