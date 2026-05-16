import { Box, Text } from '@chakra-ui/react';

interface Props {
  title: string;
  value: string;
}

export default function StatsCard({ title, value }: Props) {
  return (
    <Box bg="white" p={5} borderRadius="lg" shadow="sm">
      <Text color="gray.500">{title}</Text>
      <Text fontSize="3xl" fontWeight="bold">
        {value}
      </Text>
    </Box>
  );
}