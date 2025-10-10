import { cn } from '@/lib/utils';

interface ShopifyProgressBarProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

const ShopifyProgressBar = ({ steps, currentStep, className }: ShopifyProgressBarProps) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep >= stepNumber;
          const isCompleted = currentStep > stepNumber;

          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-all duration-200',
                    isCompleted
                      ? 'border-green-500 bg-green-500 text-white'
                      : isActive
                      ? 'border-[#5b6c8a] bg-[#5b6c8a] text-white'
                      : 'border-gray-300 bg-white text-gray-500'
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium transition-colors',
                    isCompleted || isActive ? 'text-[#5b6c8a]' : 'text-gray-500'
                  )}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-4 h-0.5 w-16 transition-colors',
                    currentStep > stepNumber ? 'bg-green-500' : 'bg-gray-300'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShopifyProgressBar;