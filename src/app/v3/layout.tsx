import type { ReactNode } from 'react';
import V3Provider from './V3Provider';
import V3Shell from './V3Shell';

export default function V3Layout({ children }: { children: ReactNode }) {
  return (
    <V3Provider>
      <V3Shell>{children}</V3Shell>
    </V3Provider>
  );
}
