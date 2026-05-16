import MainLayout from '@/src/components/layout/MainLayout';
import { Box, Heading } from '@chakra-ui/react';

export default function ReportsPage() {
  return (
    <MainLayout>
      <Box bg="white" p={5} borderRadius="lg">
        <Heading size="md">Reports</Heading>
      </Box>
    </MainLayout>
  );
}