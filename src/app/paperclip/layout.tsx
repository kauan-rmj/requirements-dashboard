import type { ReactNode } from 'react';
import { getSessionEmail } from '@/lib/paperclip-auth';
import LoginForm from './LoginForm';
import SubTabs from './SubTabs';

export default async function PaperclipLayout({ children }: { children: ReactNode }) {
  if (!(await getSessionEmail())) return <LoginForm />;
  return (
    <>
      <SubTabs />
      {children}
    </>
  );
}
