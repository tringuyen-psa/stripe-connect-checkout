import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface ShopifyCardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

const ShopifyCard = ({ children, className, padding = 'md' }: ShopifyCardProps) => {
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white shadow-sm',
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
};

export default ShopifyCard;