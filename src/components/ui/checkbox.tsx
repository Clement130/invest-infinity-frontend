import { forwardRef } from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked = false, indeterminate = false, onCheckedChange, disabled = false, className = '' }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        onClick={handleClick}
        disabled={disabled}
        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
          checked || indeterminate
            ? 'bg-purple-500 border-purple-500'
            : 'bg-transparent border-gray-500'
        } ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:border-purple-400'
        } ${className}`}
      >
        {checked && !indeterminate && <Check className="w-3 h-3 text-white" />}
        {indeterminate && <div className="w-2 h-0.5 bg-white" />}
      </button>
    );
  }
);

Checkbox.displayName = 'Checkbox';

