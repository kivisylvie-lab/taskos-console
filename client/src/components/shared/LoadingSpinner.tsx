import React from 'react';

interface Props {
  message?: string;
}

export function LoadingSpinner({ message = 'AI 正在分析中...' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
      <p className="text-gray-500 text-sm">{message}</p>
      <p className="text-gray-400 text-xs mt-1">预计需要 3-8 秒</p>
    </div>
  );
}
