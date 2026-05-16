"use client";

import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Stack,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";

import { useEffect, useState } from "react";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

interface Staff {
  sno?: number;
  staffid: string;
  userid: string;
  staffname: string;
  mobileno: string;
  role: string;
  address1: string;
  address2: string;
  address3: string;
  doj: string;
  active: string;
}

const emptyForm: Staff = {
  staffid: "",
  userid: "",
  staffname: "",
  mobileno: "",
  role: "",
  address1: "",
  address2: "",
  address3: "",
  doj: "",
  active: "Y",
};

export default function EmployeesPage() {
  const [staffs, setStaffs] = useState<Staff[]>(
    []
  );

  const [form, setForm] =
    useState<Staff>(emptyForm);

  const [loading, setLoading] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  // FETCH STAFFS
  const fetchStaffs = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/staff`
      );

      const data = await res.json();

      if (Array.isArray(data)) {
        setStaffs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStaffs();
  }, []);

  // HANDLE CHANGE
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // SAVE STAFF
  const handleSubmit = async () => {
    try {
      setLoading(true);

      const url = editing
        ? `${BASE_URL}/staff/${form.staffid}`
        : `${BASE_URL}/staff`;

      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          STAFFID: form.staffid,
          USERID: form.userid,
          STAFFNAME: form.staffname,
          MOBILENO: form.mobileno,
          ROLE: form.role,
          ADDRESS1: form.address1,
          ADDRESS2: form.address2,
          ADDRESS3: form.address3,
          DOJ: form.doj,
          ACTIVE: form.active,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed"
        );
      }

      setMessage(
        editing
          ? "Updated Successfully"
          : "Added Successfully"
      );

      setForm(emptyForm);

      setEditing(false);

      fetchStaffs();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // EDIT
  const handleEdit = (staff: Staff) => {
    setEditing(true);

    setForm(staff);
  };

  // DELETE
  const handleDelete = async (
    staffid: string
  ) => {
    if (
      !confirm(
        "Are you sure to delete?"
      )
    )
      return;

    try {
      await fetch(
        `${BASE_URL}/staff/${staffid}`,
        {
          method: "DELETE",
        }
      );

      fetchStaffs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box
      minH="100vh"
      p={8}
      bgGradient="linear(to-br, #0f172a, #1e293b, #312e81)"
    >
      <Flex
        justify="space-between"
        align="center"
        mb={8}
      >
        <Heading color="white">
          Staff Management
        </Heading>

        <Badge
          colorPalette="green"
          p={2}
          borderRadius="md"
        >
          {staffs.length} Employees
        </Badge>
      </Flex>

      {/* FORM */}
      <Box
        bg="white"
        p={6}
        rounded="2xl"
        mb={8}
        boxShadow="xl"
      >
        <Heading size="md" mb={5}>
          {editing
            ? "Update Staff"
            : "Add Staff"}
        </Heading>

        <Stack gap={4}>
          <HStack>
            <Input
              placeholder="Staff ID"
              name="staffid"
              value={form.staffid}
              onChange={handleChange}
            />

            <Input
              placeholder="User ID"
              name="userid"
              value={form.userid}
              onChange={handleChange}
            />
          </HStack>

          <Input
            placeholder="Staff Name"
            name="staffname"
            value={form.staffname}
            onChange={handleChange}
          />

          <HStack>
            <Input
              placeholder="Mobile No"
              name="mobileno"
              value={form.mobileno}
              onChange={handleChange}
            />

            <Input
              placeholder="Role"
              name="role"
              value={form.role}
              onChange={handleChange}
            />
          </HStack>

          <Input
            placeholder="Address 1"
            name="address1"
            value={form.address1}
            onChange={handleChange}
          />

          <Input
            placeholder="Address 2"
            name="address2"
            value={form.address2}
            onChange={handleChange}
          />

          <Input
            placeholder="Address 3"
            name="address3"
            value={form.address3}
            onChange={handleChange}
          />

          <Input
            type="date"
            name="doj"
            value={form.doj}
            onChange={handleChange}
          />

          <HStack>
            <Button
              colorPalette="blue"
              loading={loading}
              onClick={handleSubmit}
            >
              {editing
                ? "Update"
                : "Save"}
            </Button>

            {editing && (
              <Button
                onClick={() => {
                  setEditing(false);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </Button>
            )}
          </HStack>

          {message && (
            <Text color="red.500">
              {message}
            </Text>
          )}
        </Stack>
      </Box>

      {/* TABLE */}
      <Box
        bg="white"
        rounded="2xl"
        p={5}
        overflowX="auto"
      >
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>
                Staff ID
              </Table.ColumnHeader>

              <Table.ColumnHeader>
                Name
              </Table.ColumnHeader>

              <Table.ColumnHeader>
                Mobile
              </Table.ColumnHeader>

              <Table.ColumnHeader>
                Role
              </Table.ColumnHeader>

              <Table.ColumnHeader>
                Status
              </Table.ColumnHeader>

              <Table.ColumnHeader>
                Actions
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {staffs.map((staff) => (
              <Table.Row
                key={staff.staffid}
              >
                <Table.Cell>
                  {staff.staffid}
                </Table.Cell>

                <Table.Cell>
                  {staff.staffname}
                </Table.Cell>

                <Table.Cell>
                  {staff.mobileno}
                </Table.Cell>

                <Table.Cell>
                  {staff.role}
                </Table.Cell>

                <Table.Cell>
                  <Badge
                    colorPalette={
                      staff.active === "Y"
                        ? "green"
                        : "red"
                    }
                  >
                    {staff.active === "Y"
                      ? "Active"
                      : "Inactive"}
                  </Badge>
                </Table.Cell>

                <Table.Cell>
                  <HStack>
                    <Button
                      size="sm"
                      colorPalette="blue"
                      onClick={() =>
                        handleEdit(staff)
                      }
                    >
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      colorPalette="red"
                      onClick={() =>
                        handleDelete(
                          staff.staffid
                        )
                      }
                    >
                      Delete
                    </Button>
                  </HStack>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
}