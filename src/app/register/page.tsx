"use client";

import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";

import { registerUser } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    userId: "",
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    userId: "",
    username: "",
    password: "",
    api: "",
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setErrors((prev) => ({
      ...prev,
      [e.target.name]: "",
      api: "",
    }));
  };

  const validate = () => {
    let valid = true;

    const newErrors = {
      userId: "",
      username: "",
      password: "",
      api: "",
    };

    if (!form.userId.trim()) {
      newErrors.userId = "User ID is required";
      valid = false;
    }

    if (!form.username.trim()) {
      newErrors.username = "Username is required";
      valid = false;
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required";
      valid = false;
    }

    setErrors(newErrors);

    return valid;
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      await registerUser({
        userId: form.userId.trim(),
        username: form.username.trim(),
        password: form.password,
      });

      router.push("/login");
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        api:
          err?.message ||
          err?.error ||
          "Registration failed",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg="gray.950"
      position="relative"
      overflow="hidden"
      px={4}
    >
      {/* Background Glow */}
      <Box
        position="absolute"
        top="-120px"
        left="-120px"
        w="300px"
        h="300px"
        bg="blue.500"
        filter="blur(120px)"
        opacity={0.4}
      />

      <Box
        position="absolute"
        bottom="-120px"
        right="-120px"
        w="300px"
        h="300px"
        bg="purple.500"
        filter="blur(120px)"
        opacity={0.4}
      />

      {/* Card */}
      <Box
        w="full"
        maxW="420px"
        bg="white"
        p={10}
        rounded="3xl"
        boxShadow="dark-lg"
        zIndex={1}
      >
        <VStack gap={2} mb={8}>
          <Heading
            size="2xl"
            color="gray.800"
            textAlign="center"
          >
            Create Account
          </Heading>

          <Text color="gray.500">
            Register to continue
          </Text>
        </VStack>

        <form onSubmit={handleSubmit}>
          <Stack gap={5}>
            {/* User ID */}
            <Field.Root invalid={!!errors.userId}>
              <Field.Label>User ID</Field.Label>

              <Input
                name="userId"
                placeholder="Enter User ID"
                value={form.userId}
                onChange={handleChange}
                size="lg"
                borderRadius="xl"
              />

              <Field.ErrorText>
                {errors.userId}
              </Field.ErrorText>
            </Field.Root>

            {/* Username */}
            <Field.Root invalid={!!errors.username}>
              <Field.Label>Username</Field.Label>

              <Input
                name="username"
                placeholder="Enter Username"
                value={form.username}
                onChange={handleChange}
                size="lg"
                borderRadius="xl"
              />

              <Field.ErrorText>
                {errors.username}
              </Field.ErrorText>
            </Field.Root>

            {/* Password */}
            <Field.Root invalid={!!errors.password}>
              <Field.Label>Password</Field.Label>

              <Input
                type="password"
                name="password"
                placeholder="Enter Password"
                value={form.password}
                onChange={handleChange}
                size="lg"
                borderRadius="xl"
              />

              <Field.ErrorText>
                {errors.password}
              </Field.ErrorText>
            </Field.Root>

            {/* API Error */}
            {errors.api && (
              <Text
                color="red.500"
                fontSize="sm"
                textAlign="center"
              >
                {errors.api}
              </Text>
            )}

            {/* Register Button */}
            <Button
              type="submit"
              size="lg"
              colorPalette="blue"
              borderRadius="xl"
              loading={loading}
            >
              Register
            </Button>
          </Stack>
        </form>

        <Text
          mt={8}
          textAlign="center"
          color="gray.600"
        >
          Already have an account?{" "}
          <Link href="/login">
            <Text
              as="span"
              color="blue.500"
              fontWeight="bold"
              cursor="pointer"
            >
              Login
            </Text>
          </Link>
        </Text>
      </Box>
    </Flex>
  );
}