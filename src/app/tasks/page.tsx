import MainLayout from '@/src/components/layout/MainLayout';
import { Box, Heading } from '@chakra-ui/react';

export default function TasksPage() {
  return (
    <MainLayout>
      <Box bg="white" p={5} borderRadius="lg">
        <Heading size="md">Tasks</Heading>
      </Box>
    </MainLayout>
  );
}