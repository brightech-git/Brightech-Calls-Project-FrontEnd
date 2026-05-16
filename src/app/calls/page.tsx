import MainLayout from '@/src/components/layout/MainLayout';
import { Box, Heading } from '@chakra-ui/react';

export default function CallsPage() {
  return (
    <MainLayout>
      <Box bg="white" p={5} borderRadius="lg">
        <Heading size="md">Calls</Heading>
      </Box>
    </MainLayout>
  );
}