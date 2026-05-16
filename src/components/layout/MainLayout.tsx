'use client';

import { Flex, Box } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Flex>
      <Sidebar />

      <Box flex={1} bg="gray.100" minH="100vh">
        <Header />

        <Box p={5}>{children}</Box>
      </Box>
    </Flex>
  );
}