import SignInForm from '@/components/auth/SignInForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | SimplyRA',
  description: 'Sign in to your SimplyRA account',
};

export default function SignInPage() {
  return <SignInForm />;
}
