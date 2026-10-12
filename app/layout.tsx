import { ui } from "@/utils/ui";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import LayoutWrapper from "@/components/LayoutWrapper";
import { poppins } from "@/utils/fonts";
export const metadata: Metadata = {
  title: "Call Management System",
  description: "Employee Task & Call Management"
};
export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <html lang="en" className={ui(poppins.variable)}>
      <body>
        <Providers>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>;
}
