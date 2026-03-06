'use client';

import Link from 'next/link';
import { clsx } from 'clsx';

const DEFAULT_STEP_LABELS = ['基本資訊', '內容', '環境設定', '預覽與提交'];

interface WizardLayoutProps {
  currentStep: number;
  children: React.ReactNode;
  stepLabels?: string[];
}

export default function WizardLayout({ currentStep, children, stepLabels }: WizardLayoutProps) {
  const labels = stepLabels ?? DEFAULT_STEP_LABELS;
  const steps = labels.map((label, i) => ({ n: i, label }));

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
      >
        ← 返回首頁
      </Link>

      {/* 步驟指示器 */}
      <nav className="flex items-center justify-between mb-10">
        {steps.map((step, idx) => (
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
                {currentStep > step.n ? '✓' : step.n + 1}
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
            {idx < steps.length - 1 && (
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
