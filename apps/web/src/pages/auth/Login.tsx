import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { errorMessage } from '../../api/client';
import { ErrorAlert, Field } from '../../components/ui';
const schema = z.object({ email: z.string().trim().email('Enter a valid email address'), password: z.string().min(1, 'Enter your password') });
export function Login() {
  const auth = useAuth(); const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  return <main className="login"><div className="brand-mark">M</div><p className="eyebrow">MINI ERP + CRM</p><h1>Welcome back</h1><p>Sign in to your operations portal.</p>
    <form className="card stack" noValidate onSubmit={handleSubmit(async (input) => { setError(''); try { await auth.login(input.email, input.password); } catch (err) { setError(errorMessage(err)); } })}>
      <ErrorAlert message={error || auth.error} />
      <Field name="email" title="Email" error={errors.email?.message}><input id="email" type="email" autoComplete="username" {...register('email')} aria-invalid={!!errors.email} /></Field>
      <Field name="password" title="Password" error={errors.password?.message}><input id="password" type="password" autoComplete="current-password" {...register('password')} aria-invalid={!!errors.password} /></Field>
      <button className="primary" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}</button>
    </form><p className="small">Internal access for your operations team.</p></main>;
}
