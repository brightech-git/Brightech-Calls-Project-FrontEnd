'use client';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from './button';
export function SecretValue({
  value,
  label = 'password',
}: {
  value?: string | null;
  label?: string;
}) {
  const [visible, setVisible] = useState(false);
  if (!value) return <>—</>;
  return (
    <span className="secret-value">
      <span>{visible ? value : '••••••••'}</span>
      <Button
        variant="ghost"
        aria-label={`${visible ? 'Hide' : 'Show'} ${label}`}
        aria-pressed={visible}
        onClick={() => setVisible(!visible)}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </Button>
    </span>
  );
}
