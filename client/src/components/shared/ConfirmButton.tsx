import React from 'react';

interface Props {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  variant?: 'primary' | 'success' | 'secondary';
}

export function ConfirmButton({ onClick, disabled, loading, label = '确认并继续', variant = 'primary' }: Props) {
  const baseClass = variant === 'success' ? 'btn-success' : variant === 'secondary' ? 'btn-secondary' : 'btn-primary';

  return (
    <div className="flex justify-center pt-4">
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseClass} px-10 py-3 text-lg shadow-sm`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            处理中...
          </span>
        ) : (
          label
        )}
      </button>
    </div>
  );
}
