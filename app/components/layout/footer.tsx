import { ReactNode } from 'react';

import { Button } from '../ui/button';
import Logo from '../logo';

function FooterLink({ label }: { label: string }) {
  return (
    <Button
      asChild={true}
      variant='ghost'
      size='none'
      className='rounded-none cursor-pointer justify-start py-1 text-xs text-gray-700 hover:bg-neutral-100 sm:justify-end'
    >
      <a>{label}</a>
    </Button>
  );
}

function FooterIcon({ children }: { children: ReactNode }) {
  return (
    <Button asChild={true} variant='ghost' size='none' className='p-1'>
      <a>
        <svg className='w-3.5 fill-gray-500' viewBox='0 0 24 24'>
          {children}
        </svg>
      </a>
    </Button>
  );
}

export default function Footer() {
  return (
    <div className='mt-auto border-t border-gray-100'>
      <div className='mx-auto flex max-w-screen-xl flex-col justify-between gap-4 p-8 sm:flex-row'>
        <div className='flex flex-col gap-4'>
          <Logo />

          <p className='max-w-80 text-xs leading-5 text-gray-500'>
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
            officia deserunt mollit anim id est laborum
          </p>
        </div>

        <div className='grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2'>
          <FooterLink label='Our Story' />

          <FooterLink label='Catering' />

          <FooterLink label='Ingredients' />

          <FooterLink label='Core Values' />

          <FooterLink label='Get Our App' />

          <FooterLink label='Fundraiding' />

          <FooterLink label='Blog' />

          <FooterLink label='Gift Cards' />

          <FooterLink label='Contact Us' />

          <FooterLink label='Privacy Policy' />
        </div>
      </div>

      <div className='bg-neutral-100'>
        <div className='mx-auto flex max-w-screen-xl flex-col-reverse justify-between gap-2 px-8 py-4 sm:flex-row sm:items-center'>
          <span className='text-xs text-gray-500'>{`© SPOONS ${new Date().getFullYear()}. All rights reserved.`}</span>

          <span className='ml-[-8px] space-x-1 sm:ml-0'>
            <FooterIcon>
              <path d='M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m13 2h-2.5A3.5 3.5 0 0 0 12 8.5V11h-2v3h2v7h3v-7h3v-3h-3V9a1 1 0 0 1 1-1h2V5z'></path>
            </FooterIcon>

            <FooterIcon>
              <path d='M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z'></path>
            </FooterIcon>

            <FooterIcon>
              <path d='M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z'></path>
            </FooterIcon>

            <FooterIcon>
              <path d='M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z'></path>
            </FooterIcon>
          </span>
        </div>
      </div>
    </div>
  );
}
