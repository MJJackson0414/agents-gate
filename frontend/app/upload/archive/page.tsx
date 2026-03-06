'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { UploadProvider } from '@/lib/upload-context';
import WizardLayout from '@/components/upload/WizardLayout';
import WizardStep1Basic from '@/components/upload/WizardStep1Basic';
import WizardStep3Environment from '@/components/upload/WizardStep3Environment';
import ArchiveStep0Upload from '@/components/upload/archive/ArchiveStep0Upload';
import ArchiveStep2FileTree from '@/components/upload/archive/ArchiveStep2FileTree';
import ArchiveStep4Preview from '@/components/upload/archive/ArchiveStep4Preview';

const ARCHIVE_STEP_LABELS = ['上傳解析', '基本資訊', '檔案結構', '環境設定', '預覽送出'];

function ArchiveWizardContent() {
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step');
  const step = Number(stepParam ?? '0');
  const validStep = [0, 1, 2, 3, 4].includes(step) ? step : 0;

  return (
    <WizardLayout currentStep={validStep} stepLabels={ARCHIVE_STEP_LABELS}>
      {validStep === 0 && <ArchiveStep0Upload />}
      {validStep === 1 && <WizardStep1Basic />}
      {validStep === 2 && <ArchiveStep2FileTree />}
      {validStep === 3 && <WizardStep3Environment />}
      {validStep === 4 && <ArchiveStep4Preview />}
    </WizardLayout>
  );
}

export default function ArchiveWizardPage() {
  return (
    <UploadProvider>
      <Suspense fallback={<div className="max-w-2xl mx-auto py-20 text-center text-gray-400">載入中...</div>}>
        <ArchiveWizardContent />
      </Suspense>
    </UploadProvider>
  );
}
