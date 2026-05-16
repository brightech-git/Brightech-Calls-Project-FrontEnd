"use client";

import { Box, VStack } from "@chakra-ui/react";
import Link from "next/link";

export default function Sidebar() {
  return (
    <Box
      w="250px"
      bg="black"
      color="white"
      minH="100vh"
      p={5}
    >
      <VStack align="start">
        <Link href="/dashboard">
          Dashboard
        </Link>

        <Link href="/projects">
          Projects
        </Link>

        <Link href="/employees">
          Employees
        </Link>
      </VStack>
    </Box>
  );
}