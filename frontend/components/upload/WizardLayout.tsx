'use client';

import { clsx } from 'clsx';

const STEPS = [
  { n: 1, label: '基本資訊' },
  { n: 2, label: '內容' },
  { n: 3, label: '環境設定' },
  { n: 4, label: '預覽與提交' },
];

interface WizardLayoutProps {
  currentStep: 1 | 2 | 3 | 4;
  children: React.ReactNode;
}

export default function WizardLayout({ currentStep, children }: WizardLayoutProps) {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* 步驟指示器 */}
      <nav className="flex items-center justify-between mb-10">
        {STEPS.map((step, idx) => (
          <div key={step.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors',
                  currentStep === step.n
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : currentStep > step.n
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 bg-white text-gray-400'
                )}
              >
                {currentStep > step.n ? '✓' : step.n}
              </div>
              <span
                className={clsx(
                  'mt-1 text-xs font-medium hidden sm:block',
                  currentStep === step.n ? 'text-blue-600' : 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={clsx(
                  'flex-1 h-0.5 mx-2',
                  currentStep > step.n ? 'bg-blue-400' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        ))}
      </nav>

      {/* 步驟內容 */}
      <div>{children}</div>
    </div>
  );
}
