export default function Avatar({ user, size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-6 h-6 text-[11px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.fullName || 'Avatar'}
        className={`${sizes[size] || sizes.md} rounded-full object-cover border border-slate-200 flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size] || sizes.md} rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold flex-shrink-0 ${className}`}
    >
      {user?.fullName?.[0]?.toUpperCase() || '?'}
    </div>
  );
}
