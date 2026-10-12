import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { en } from '../../i18n/en';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export function LogoutPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/welcome', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
      <Card className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-[var(--text)] mb-6">
          {en.logoutTitle}
        </h1>
        <p className="text-lg text-[var(--text)] mb-8">
          {en.logoutConfirm}
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate(-1)} aria-label={en.logoutStay}>
            {en.logoutStay}
          </Button>
          <Button
            variant="danger"
            onClick={handleLogout}
            aria-label={en.logoutButton}
          >
            {en.logoutButton}
          </Button>
        </div>
      </Card>
    </div>
  );
}
