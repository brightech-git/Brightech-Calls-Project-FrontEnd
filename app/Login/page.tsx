"use client";

import { ui } from "@/utils/ui";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { useLogin } from '@/hooks/Auth/useAuth';
import { Eye, EyeOff, Headphones, ArrowRight, CheckCircle2, Workflow, Users } from 'lucide-react';
export default function LoginPage() {
  const router = useRouter();
  const {
    mutate: login,
    isPending
  } = useLogin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    login({
      username,
      password
    }, {
      onSuccess: () => router.replace('/Home'),
      onError: (error: unknown) => setError(isAxiosError(error) ? error.response?.data?.message || 'Unable to sign in. Check your credentials and connection.' : 'Unable to sign in. Please try again.')
    });
  };
  return <main className={ui("login-page")}><section className={ui("login-story")} aria-label="Brightech Calls">
    <div className={ui("login-brand")}><span><Headphones size={24} /></span><strong>brightech <em>calls</em></strong></div>
    <div className={ui("login-story-content")}><div className={ui("login-story-tag")}>A BETTER DAY AT WORK</div><h1>Great service.<br />One call at a time.</h1><p>A focused workspace for your clients, projects, and the people who keep things moving.</p><div className={ui("login-features")}><span><Workflow size={18} />Keep every task on track</span><span><Users size={18} />Stay connected with your clients</span><span><CheckCircle2 size={18} />Turn follow-ups into resolutions</span></div></div>
    <div className={ui("login-story-footer")}>Brightech Software · Calls Management</div>
  </section><section className={ui("login-form-side")}><div className={ui("login-card")}><div className={ui("login-mobile-brand")}><Headphones size={23} />Brightech Calls</div><div className={ui("ui-eyebrow")}>YOUR WORKSPACE AWAITS</div><h2>Welcome back</h2><p className={ui("login-intro")}>Sign in to manage your calls and assignments.</p>
    <form onSubmit={handleLogin}><div className={ui("login-field")}><label htmlFor="login-username">Username</label><input id="login-username" autoComplete="username" required value={username} onChange={event => setUsername(event.target.value.toUpperCase())} placeholder="Enter your username" disabled={isPending} /></div><div className={ui("login-field")}><label htmlFor="login-password">Password</label><div className={ui("login-password-wrap")}><input id="login-password" autoComplete="current-password" required type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" disabled={isPending} aria-describedby={error ? 'login-error' : undefined} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
    {error && <p id="login-error" className={ui("login-error")} role="alert">{error}</p>}<button className={ui("login-submit")} type="submit" disabled={isPending}>{isPending ? 'Signing in…' : 'Sign in'}<ArrowRight size={18} /></button></form><p className={ui("login-help")}>Need access? Contact your workspace administrator.</p></div><p className={ui("login-copyright")}>Brightech Calls · Built for better service</p></section></main>;
}
