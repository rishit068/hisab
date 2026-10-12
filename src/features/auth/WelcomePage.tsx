import { en } from '../../i18n/en';
import { Card } from '../../components/ui/Card';

export function WelcomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
      <Card className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-[var(--primary)] mb-4">
          {en.welcomeTitle}
        </h1>
        <p className="text-lg text-[var(--muted)] mb-6">
          {en.welcomeSubtitle}
        </p>
        <p className="text-base text-[var(--text)]">
          {en.welcomeNeedInvite}
        </p>
      </Card>
    </div>
  );
}
