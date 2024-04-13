import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import useAuthentication from '@/hooks/useAuthentication';

type Props = { children: ReactNode };

export default function Layout({ children }: Props) {
  const { isAuthenticated } = useAuthentication();

  if (!isAuthenticated) redirect('/');

  return <>{children}</>;
}
