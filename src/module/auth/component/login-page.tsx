'use client';

import { buttonClass, buttonVariants } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiErrorMessage } from '@/lib/api/errors';
import { useLogin } from '@/src/module/auth/hook/use-auth';
import {
  Eye,
  EyeOff,
  Headphones,
  ArrowRight,
  CheckCircle2,
  Workflow,
  Users,
} from 'lucide-react';
/** Saved on this browser only, and kept on log out. The password is never stored. */
const REMEMBER_KEY = 'calls-remember-username';

export default function LoginPage() {
  const router = useRouter();
  const { mutate: login, isPending } = useLogin();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);
  const userRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // A remembered username is filled in and the cursor goes straight to the password.
  useEffect(() => {
    let saved = '';
    try {
      saved = localStorage.getItem(REMEMBER_KEY) ?? '';
    } catch {
      /* storage blocked: start empty */
    }
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from storage after mount
      setUserName(saved);
      setRemember(true);
      passwordRef.current?.focus();
    } else {
      userRef.current?.focus();
    }
  }, []);
  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    login(
      {
        userName,
        password,
      },
      {
        onSuccess: () => {
          try {
            if (remember) localStorage.setItem(REMEMBER_KEY, userName.trim());
            else localStorage.removeItem(REMEMBER_KEY);
          } catch {
            /* storage blocked: nothing to remember */
          }
          router.replace('/Home');
        },
        onError: (error: unknown) => setError(getApiErrorMessage(error)),
      },
    );
  };
  return (
    <main className="grid min-h-dvh grid-cols-2 bg-white max-md:block">
      <section
        className="relative flex min-h-dvh flex-col overflow-hidden bg-[radial-gradient(ellipse_at_0%_100%,#244784,transparent_65%)] bg-sidebar p-[clamp(32px,5vw,76px)] text-white max-md:hidden"
        aria-label="Brightech Calls"
      >
        <div className="flex items-center gap-3 [&>span]:grid [&>span]:size-11 [&>span]:place-items-center [&>span]:rounded-xl [&>span]:bg-brand [&>strong]:text-xl [&>strong]:tracking-tight [&_em]:text-blue-200 [&_em]:not-italic">
          <span>
            <Headphones size={24} />
          </span>
          <strong>
            Brightech <em>Calls</em>
          </strong>
        </div>
        <div className="relative z-1 my-auto py-20 [&>h1]:mb-6 [&>h1]:text-[clamp(34px,3.8vw,56px)] [&>h1]:leading-[1.12] [&>h1]:tracking-tight [&>p]:max-w-sm [&>p]:text-sm [&>p]:leading-8 [&>p]:text-blue-100/80">
          <div className="mb-6 text-[10px] tracking-widest text-blue-200">
            A BETTER DAY AT WORK
          </div>
          <h1>
            Great service.
            <br />
            One call at a time.
          </h1>
          <p>
            A focused workspace for your clients, projects, and the people who keep things
            moving.
          </p>
          <div className="mt-9 grid gap-4 text-sm text-blue-100 [&>span]:flex [&>span]:items-center [&>span]:gap-3 [&_svg]:text-blue-300">
            <span>
              <Workflow size={18} />
              Keep every task on track
            </span>
            <span>
              <Users size={18} />
              Stay connected with your clients
            </span>
            <span>
              <CheckCircle2 size={18} />
              Turn follow-ups into resolutions
            </span>
          </div>
        </div>
        <div className="text-xs text-blue-200/70">
          Brightech Software · Calls Management
        </div>
      </section>
      <section className="relative flex min-h-dvh flex-col items-center justify-center px-10 py-12 max-md:px-7">
        <div className="w-full max-w-[370px] [&>h2]:mt-3 [&>h2]:mb-2 [&>h2]:text-3xl [&>h2]:tracking-tight">
          <div className="mb-11 hidden items-center gap-2.5 text-lg text-brand max-md:flex">
            <Headphones size={23} />
            Brightech Calls
          </div>
          <div className="text-[10px] tracking-widest text-muted uppercase">
            YOUR WORKSPACE AWAITS
          </div>
          <h2>Welcome back</h2>
          <p className="mb-8 text-sm leading-7 text-muted">
            Sign in to manage your calls and assignments.
          </p>
          <form onSubmit={handleLogin}>
            <div className="mb-5 [&>label]:mb-2 [&>label]:block [&>label]:text-xs [&>label]:text-muted [&_input]:h-12 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-line [&_input]:bg-white [&_input]:px-3.5 [&_input]:text-sm [&_input]:outline-none [&_input:focus]:border-brand [&_input:focus]:ring-3 [&_input:focus]:ring-brand-soft">
              <label htmlFor="login-username">Username</label>
              <input
                id="login-username"
                ref={userRef}
                autoComplete="username"
                required
                value={userName}
                onChange={(event) => setUserName(event.target.value.toUpperCase())}
                placeholder="Enter your username"
                disabled={isPending}
              />
            </div>
            <div className="mb-5 [&>label]:mb-2 [&>label]:block [&>label]:text-xs [&>label]:text-muted [&_input]:h-12 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-line [&_input]:bg-white [&_input]:px-3.5 [&_input]:text-sm [&_input]:outline-none [&_input:focus]:border-brand [&_input:focus]:ring-3 [&_input:focus]:ring-brand-soft">
              <label htmlFor="login-password">Password</label>
              <div className="relative [&>input]:pr-12 [&>button]:absolute [&>button]:top-1.5 [&>button]:right-1.5 [&>button]:grid [&>button]:size-9 [&>button]:place-items-center [&>button]:rounded-md [&>button]:border-0 [&>button]:bg-transparent [&>button]:text-muted">
                <input
                  id="login-password"
                  ref={passwordRef}
                  autoComplete="current-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  disabled={isPending}
                  aria-describedby={error ? 'login-error' : undefined}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="-mt-1 mb-4 flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-ink select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  disabled={isPending}
                  className="size-4 accent-brand"
                />
                Remember me
              </label>
              {remember && userName && (
                <button
                  type="button"
                  className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
                  onClick={() => {
                    setUserName('');
                    setRemember(false);
                    try {
                      localStorage.removeItem(REMEMBER_KEY);
                    } catch {
                      /* ignore */
                    }
                    userRef.current?.focus();
                  }}
                >
                  Not you?
                </button>
              )}
            </div>
            {error && (
              <p
                id="login-error"
                className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
                role="alert"
              >
                {error}
              </p>
            )}
            <button
              className={cn(buttonClass, buttonVariants.primary, 'mt-7 h-12 w-full')}
              type="submit"
              disabled={isPending}
            >
              {isPending ? 'Signing in…' : 'Sign in'}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="mt-6 text-center text-xs leading-7 text-muted">
            Need access? Contact your workspace administrator.
          </p>
        </div>
        <p className="absolute bottom-7 text-[10px] text-muted">
          Brightech Calls · Built for better service
        </p>
      </section>
    </main>
  );
}
