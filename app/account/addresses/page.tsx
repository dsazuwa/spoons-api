import { AccountLayout } from '@/components/layout/account';
import { ClientLayout } from '@/components/layout/client';

export default function Addresses() {
  return (
    <ClientLayout>
      <AccountLayout>
        <div>Addresses</div>
      </AccountLayout>
    </ClientLayout>
  );
}
