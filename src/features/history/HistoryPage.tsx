import { en } from '../../i18n/en';
import { Card } from '../../components/ui/Card';

export function HistoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[var(--text)]">
        {en.historyTitle}
      </h1>

      {/* Empty state */}
      <Card>
        <p className="text-lg text-[var(--muted)] text-center">
          {en.historyEmpty}
        </p>
      </Card>
    </div>
  );
}
