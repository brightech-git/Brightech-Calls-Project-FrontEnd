'use client';

import { cn } from '@/lib/utils';
import { controlClass } from '@/lib/styles';
import * as React from 'react';
import { Input, IconButton, InputProps, Box } from '@chakra-ui/react';
import { FiMenu, FiEye, FiEyeOff } from 'react-icons/fi';
export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  function PasswordInput(props, ref) {
    const [show, setShow] = React.useState(false);
    return (
      <Box className="relative w-full">
        <Input
          ref={ref}
          type={show ? 'text' : 'password'}
          {...props}
          className={cn(controlClass, 'pr-10')}
        />

        <IconButton
          type="button"
          aria-label={show ? 'Hide password' : 'Show password'}
          size="sm"
          variant="ghost"
          onClick={() => setShow(!show)}
          className="absolute right-1 top-1/2 -translate-y-1/2"
        >
          {' '}
          {show ? <FiEye /> : <FiEyeOff />}{' '}
        </IconButton>
      </Box>
    );
  },
);
