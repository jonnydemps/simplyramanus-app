import SignUpForm from '@/components/auth/SignUpForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | SimplyRA',
  description: 'Create a new SimplyRA account',
};

export default function SignUpPage() {
  return <SignUpForm />;
}
