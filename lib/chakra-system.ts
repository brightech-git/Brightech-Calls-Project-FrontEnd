import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

/**
 * Chakra still powers a few behaviour primitives (dialogs, drawers, popovers,
 * comboboxes). Its styles are placed in named cascade layers that come before
 * Tailwind's (see app/globals.css), and its fonts point at Poppins, so the
 * Tailwind classes stay in charge of the look.
 */
const config = defineConfig({
  layers: {
    reset: 'chakra-reset',
    base: 'chakra-base',
    tokens: 'chakra-tokens',
    recipes: 'chakra-recipes',
  },
  globalCss: {
    'html, body': { fontFamily: 'var(--font-poppins), sans-serif', bg: 'white', color: 'black' },
  },
  theme: {
    tokens: {
      fonts: {
        heading: { value: 'var(--font-poppins), sans-serif' },
        body: { value: 'var(--font-poppins), sans-serif' },
        mono: { value: 'var(--font-poppins), monospace' },
      },
    },
  },
});

export const chakraSystem = createSystem(defaultConfig, config);
