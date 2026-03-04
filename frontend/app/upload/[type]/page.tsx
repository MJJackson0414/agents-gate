'use client';

import { useSearchParams, useParams, notFound } from 'next/navigation';
import { UploadProvider } from '@/lib/upload-context';
import WizardLayout from '@/components/upload/WizardLayout';
import WizardStep1Basic from '@/components/upload/WizardStep1Basic';
import WizardStep2Content from '@/components/upload/WizardStep2Content';
import WizardStep3Environment from '@/components/upload/WizardStep3Environment';
import WizardStep4Preview from '@/components/upload/WizardStep4Preview';

const VALID_TYPES = ['skill', 'agent'] as const;
type ValidType = typeof VALID_TYPES[number];

export default function UploadWizardPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const typeParam = params.type as string;
  if (!VALID_TYPES.includes(typeParam as ValidType)) {
    notFound();
  }

  const stepParam = searchParams.get('step');
  const step = (Number(stepParam) as 1 | 2 | 3 | 4) || 1;
  const validStep = [1, 2, 3, 4].includes(step) ? step : 1;

  return (
    <UploadProvider>
      <WizardLayout currentStep={validStep as 1 | 2 | 3 | 4}>
        {validStep === 1 && <WizardStep1Basic />}
        {validStep === 2 && <WizardStep2Content />}
        {validStep === 3 && <WizardStep3Environment />}
        {validStep === 4 && <WizardStep4Preview />}
      </WizardLayout>
    </UploadProvider>
  );
}
