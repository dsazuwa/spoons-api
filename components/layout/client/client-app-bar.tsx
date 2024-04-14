import Link from 'next/link';

import LocationDialog from '@/components/location/dialog';
import Logo from '@/components/logo';
import useAuthentication from '@/hooks/useAuthentication';
import { getAddresses } from '@/lib/data';
import { unauthLinks } from './client-constants';
import ClientAppBarDrawer from './client-drawer';
import LogoutButton from './logout-btn';

export default async function ClientAppBar() {
  const { isAuthenticated } = useAuthentication();
  const { addresses } = await getAddresses();

  return (
    <nav id='client-app-bar' className='fixed z-50 h-12 w-full bg-white'>
      <div className='mx-auto flex h-full w-full max-w-screen-2xl flex-row items-center gap-2 border-b border-solid border-neutral-100 px-4 sm:gap-4 sm:px-8'>
        <ClientAppBarDrawer isAuthenticated={isAuthenticated} />

        <Link href='/'>
          <Logo />
        </Link>

        <LocationDialog addresses={addresses} />

        <div className='ml-auto hidden gap-4 sm:flex'>
          {isAuthenticated ? (
            <LogoutButton />
          ) : (
            unauthLinks.map(({ name, href }) => (
              <Link
                className='text-xs font-semibold text-neutral-600'
                key={`${name}-link`}
                href={href}
              >
                {name}
              </Link>
            ))
          )}
        </div>
      </div>
    </nav>
  );
}
