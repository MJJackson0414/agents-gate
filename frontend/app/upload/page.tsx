import { UploadProvider } from '@/lib/upload-context';
import TypeDecisionCard from '@/components/upload/TypeDecisionCard';

export default function UploadPage() {
  return (
    <UploadProvider>
      <TypeDecisionCard />
    </UploadProvider>
  );
}
