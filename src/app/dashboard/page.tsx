import { Grid } from '@chakra-ui/react';
import MainLayout from '@/src/components/layout/MainLayout';
import StatsCard from '@/src/components/cards/StatsCard';

export default function DashboardPage() {
  return (
    <MainLayout>
      <Grid templateColumns="repeat(4,1fr)" gap={5}>
        <StatsCard title="Employees" value="25" />
        <StatsCard title="Projects" value="10" />
        <StatsCard title="Tasks" value="145" />
        <StatsCard title="Calls" value="320" />
      </Grid>
    </MainLayout>
  );
}