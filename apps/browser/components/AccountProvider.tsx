'use client';

import { signIn, useSession } from 'next-auth/react';
import { ReactNode } from 'react';

export default function AccountProvider({
  children,
}: {
  children: ReactNode;
}) {
  useSession({
    required: true,
    onUnauthenticated() {
      signIn(
        'credentials',
        { redirect: false, callbackUrl: `${location.origin}` }
      )
    },
  })

  return <>{children}</>;
}