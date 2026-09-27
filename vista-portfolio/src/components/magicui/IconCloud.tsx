import { cn } from '../../utils/helpers';

interface IconCloudProps {
  className?: string;
  icons: Array<{
    name: string;
    icon?: React.ReactNode;
    color?: string;
    bgColor?: string;
    size?: 'sm' | 'md' | 'lg';
  }>;
  gap?: number;
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

const iconSizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function IconCloud({ className, icons, gap = 2 }: IconCloudProps) {
  return (
    <div className={cn('flex flex-wrap items-center', className)} style={{ gap: `${gap}px` }}>
      {icons.map((item, index) => (
        <span
          key={`${item.name}-${index}`}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200',
            'hover:scale-105 hover:shadow-lg',
            sizeClasses[item.size || 'md']
          )}
          style={{
            background: item.bgColor || `${item.color || '#0078d7'}20`,
            border: `1px solid ${item.color || '#0078d7'}40`,
            color: item.color || '#0078d7',
          }}
        >
          {item.icon && (
            <span className={cn('flex-shrink-0', iconSizeClasses[item.size || 'md'])}>{item.icon}</span>
          )}
          {item.name}
        </span>
      ))}
    </div>
  );
}

interface IconChipProps {
  icon: React.ReactNode;
  color?: string;
  size?: number;
}

export function IconChip({ icon, color = '#0078d7', size = 22 }: IconChipProps) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: `${color}15`,
        border: `1px solid ${color}30`,
      }}
    >
      {icon}
    </span>
  );
}