This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Choosing a dropdown

| Need | Use |
|---|---|
| Short fixed list where one value is always picked (Yes / No, Active / Inactive, a few statuses) | `type: "select"` in a field config, or `NativeSelect` (`components/ui/NativeSelect.tsx`) with `YES_NO_OPTIONS` / `ACTIVE_OPTIONS` |
| Long or loaded list, type to search in the field | `type: "combobox"`, or `ComboBox` (`components/ui/ComboBox.tsx`) |
| Same, but the field only shows the value and the search box sits on top of the list | add `searchInModal: true` |
| Let the user create a missing entry | `addNew: true` and `onAddNew(searchText)`; `openMaster(path)` from `utils/openMaster.ts` opens the master screen in a new tab and the list refreshes when the user comes back |
| Allow clearing a non-required value | `clearable: true` |

Enter picks an option and moves to the next field in the form.
