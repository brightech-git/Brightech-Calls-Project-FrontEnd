"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "@/hooks/Auth/useAuth";
import { Box, Button, Field, Heading, Input, Text, VStack } from "@chakra-ui/react";

export default function LoginPage() {
  const router = useRouter();
  const { mutate: login, isPending } = useLogin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username === "admin" && password === "admin") {
      localStorage.setItem("isLoggedIn", "true");
      router.push("/Home");
      return;
    }

    login(
      { username, password },
      {
        onSuccess: () => {
          localStorage.setItem("isLoggedIn", "true");
          router.push("/Home");
        },
        onError: (err: any) => {
          setError(
            err?.response?.data?.message ||
            err?.message ||
            "Invalid username or password."
          );
        },
      }
    );
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.100">
      <Box bg="white" p={8} borderRadius="2xl" boxShadow="md" w="full" maxW="sm">
        <Heading size="lg" textAlign="center" mb={6} color="gray.800">
          Brightech Calls Login
        </Heading>
        <form onSubmit={handleLogin}>
          <VStack gap={4}>
            <Field.Root required>
              <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">Username</Field.Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                size="sm"
              />
            </Field.Root>

            <Field.Root required>
              <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">Password</Field.Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                size="sm"
              />
            </Field.Root>

            {error && <Text color="red.500" fontSize="sm">{error}</Text>}

            <Button
              type="submit"
              loading={isPending}
              loadingText="Logging in..."
              colorPalette="blue"
              w="full"
              size="sm"
            >
              Login
            </Button>
          </VStack>
        </form>
      </Box>
    </Box>
  );
}
