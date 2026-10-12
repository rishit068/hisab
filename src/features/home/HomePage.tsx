import { useAuth } from '../auth/AuthProvider';
import { en } from '../../i18n/en';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function HomePage() {
  const { member } = useAuth();
  const name = member?.name ?? '';

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <h1 className="text-2xl font-bold text-[var(--text)]">
        {en.greeting.replace('{{name}}', name)}
      </h1>

      {/* Summary card placeholder */}
      <Card>
        <p className="text-lg text-[var(--muted)]">
          {en.homeAllSettled}
        </p>
      </Card>

      {/* Empty state */}
      <Card>
        <p className="text-lg text-[var(--muted)] text-center">
          {en.homeNoExpenses}
        </p>
      </Card>

      {/* Add expense button */}
      <Button aria-label={en.homeAddExpense}>
        {en.homeAddExpense}
      </Button>

      {/* Updated timestamp */}
      <p className="text-base text-[var(--muted)] text-center">
        {en.homeUpdatedJustNow}
      </p>
    </div>
  );
}
