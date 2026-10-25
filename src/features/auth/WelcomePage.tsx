import { en } from '../../i18n/en';
import { Card } from '../../components/ui/Card';

export function WelcomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--primary)]">
          Hisaab
        </h1>
        <Card className="text-center">
          <p className="text-xl font-semibold text-[var(--text)] mb-3">
            {en.welcomeTitle}
          </p>
          <p className="text-lg text-[var(--muted)] mb-4">
            {en.welcomeSubtitle}
          </p>
          <p className="text-base text-[var(--text)]">
            {en.welcomeNeedInvite}
          </p>
        </Card>
      </div>
    </div>
  );
}
