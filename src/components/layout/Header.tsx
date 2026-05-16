"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  const [username, setUsername] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (user) {
      const parsedUser = JSON.parse(user);

      setUsername(
        parsedUser.username || ""
      );
    }
  }, []);

  const handleLogout = () => {
    // clear storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // redirect login
    router.push("/login");
  };

  return (
    <Flex
      bg="white"
      px={5}
      py={4}
      align="center"
      justify="space-between"
      borderBottom="1px solid #e2e8f0"
    >
      <Text fontWeight="bold">
        Welcome {username}
      </Text>

      <Button
        colorScheme="red"
        size="sm"
        onClick={handleLogout}
      >
        Logout
      </Button>
    </Flex>
  );
}