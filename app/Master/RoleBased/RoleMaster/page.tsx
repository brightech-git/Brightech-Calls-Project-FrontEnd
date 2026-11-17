'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  VStack,
  Text,
  Grid,
  GridItem,
  HStack,
  Fieldset,
  Flex,
  Badge,
  Spinner,
} from '@chakra-ui/react';
import { AiOutlineSave } from 'react-icons/ai';
import { IoIosExit } from 'react-icons/io';
import { FaEdit, FaTrash, FaPrint, FaFileExcel } from 'react-icons/fa';
import { Toaster, toaster } from '@/components/ui/toaster';

/*------------------CONTEXT ------------------------------*/
// import { useTheme } from "@/context/theme/themeContext";
// import { usePrint } from "@/context/print/usePrintContext";

/*------------------HOOKS ------------------------------*/
import { useRole } from '@/hooks/ApiHooks/RoleMaster/useRoleMaster';

/*------------------CONFIG ------------------------------*/
import { RoleMaster as RoleMasterConfig } from '@/config/Master/RoleMaster';

/*------------------TYPES ------------------------------*/
import { Role, RolePayload } from '@/types/RoleMaster/RoleMaster';

/*------------------COMPONENTS ------------------------------*/
import ScrollToTop from '@/components/scroll/ScrollToTop';
import { CustomTable } from '@/components/CustomTable';
import SearchBar from '@/components/search/SearchBar';
import { DynamicForm } from '@/components/form/DynamicForm';
import { useEnterNavigation } from '@/components/form/useEnterNavigation';
const USERID = 1;
const emptyForm: RolePayload = {
  ROLENAME: '',
  ACTIVE: 'Y',
  PWDACCESS: 'Y',
  ADMINACCESS: 'N',
  USERID,
};
const yesNoItems = [
  {
    label: 'YES',
    value: 'Y',
  },
  {
    label: 'NO',
    value: 'N',
  },
];

export default function RoleMaster() {
  // const { theme } = useTheme();
  const router = useRouter();
  // const { setData, setColumns, setShowSno, title } = usePrint();
  const { roles, loading, addRole, editRole, removeRole } = useRole();
  const roleMasterForm = RoleMasterConfig({
    yesOrNo: yesNoItems,
  });
  const [form, setForm] = useState<RolePayload>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const size = 10;

  // Filter and pagination
  const filteredRoles = roles.filter((r) =>
    r.ROLENAME.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const totalElements = filteredRoles.length;
  const totalPages = Math.ceil(totalElements / size);
  const paginatedRoles = filteredRoles.slice(page * size, (page + 1) * size);

  // Effects
  useEffect(() => {
    if (editId !== null) {
      const r = roles.find((r) => r.ROLEID === editId);
      if (r) {
        setForm({
          ROLENAME: r.ROLENAME,
          ACTIVE: r.ACTIVE,
          PWDACCESS: r.PWDACCESS,
          ADMINACCESS: r.ADMINACCESS,
          USERID: r.USERID,
        });
        ScrollToTop();
      }
    }
  }, [editId, roles]);
  useEffect(() => {
    if (!highlightedId) return;
    const t = setTimeout(() => setHighlightedId(null), 3000);
    return () => clearTimeout(t);
  }, [highlightedId]);
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  // Handlers
  const handleChange = (field: keyof RolePayload, value: any) => {
    const safeValue =
      value?.target?.value ??
      // native select
      value?.value ??
      // custom select {label,value}
      value; // direct value

    setForm((prev) => ({
      ...prev,
      [field]: safeValue,
    }));
  };
  const resetForm = () => {
    setEditId(null);
    setForm(emptyForm);
  };
  const validateForm = () => {
    if (!form.ROLENAME?.trim()) {
      toaster.error({
        title: 'Error',
        description: 'Role name is required',
      });
      return false;
    }
    const exists = roles.some(
      (r) =>
        r.ROLENAME.toLowerCase() === form.ROLENAME.trim().toLowerCase() &&
        r.ROLEID !== editId,
    );
    if (exists) {
      toaster.error({
        title: 'Error',
        description: 'Role name already exists',
      });
      return false;
    }
    return true;
  };
  const formNames = roleMasterForm.map((f) => f.name);
  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (editId !== null) {
        await editRole(editId, form);
        toaster.success({
          title: 'Success',
          description: 'Role updated successfully',
        });
      } else {
        const newRole = (await addRole(form)) as unknown as Role;
        if (newRole?.ROLEID) setHighlightedId(newRole.ROLEID);
        toaster.success({
          title: 'Success',
          description: 'Role created successfully',
        });
      }
      resetForm();
    } catch (error: any) {
      toaster.error({
        title: 'Error',
        description: error?.message || 'Failed to save role',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleEdit = (role: Role) => {
    setEditId(role.ROLEID);
  };
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await removeRole(id);
      toaster.success({
        title: 'Success',
        description: 'Role deleted successfully',
      });
      if (paginatedRoles.length === 1 && page > 0) setPage(page - 1);
    } catch (error: any) {
      toaster.error({
        title: 'Error',
        description: error?.message || 'Failed to delete role',
      });
    }
  };

  // Export
  // const handleExport = (option: string) => {
  //     setData(filteredRoles.map(({ ROLEID, ROLENAME, ACTIVE, PWDACCESS, ADMINACCESS }) => ({ ROLEID, ROLENAME, ACTIVE, PWDACCESS, ADMINACCESS })));
  //     setColumns([
  //         { key: "ROLEID", label: "Role Id" },
  //         { key: "ROLENAME", label: "Role Name" },
  //         { key: "ACTIVE", label: "Active" },
  //         { key: "PWDACCESS", label: "Password Access" },
  //         { key: "ADMINACCESS", label: "Admin Access" },
  //     ]);
  //     setShowSno(true);
  //     title?.("Role Master");
  //     router.push(`/print?export=${option}`);
  // };

  const { register, focusFirst, focusNext } = useEnterNavigation(formNames, handleSave);
  if (loading) {
    return (
      <Box
        className="flex justify-center items-center min-h-screen"
      >
        <Spinner
          size="xl"
          //  color={theme.colors.accient}
        />
      </Box>
    );
  }
  return (
    <Box className="[&_table]:w-full [&_table]:border-collapse [&_th]:bg-slate-50 [&_th]:px-3.5 [&_th]:py-row [&_th]:text-xs [&_th]:tracking-wide [&_th]:text-muted [&_th]:uppercase [&_td]:border-b [&_td]:border-slate-100 [&_td]:px-3.5 [&_td]:py-row [&_td]:text-sm [&_tbody_tr:hover]:bg-brand-soft [&_button]:min-h-9 [&_button]:rounded-lg [&_[role=tab]]:min-h-11 [&_[role=tab][data-selected]]:bg-brand-soft [&_[role=tab][data-selected]]:text-brand font-normal">
      <Toaster />
      <Grid
        className="grid-cols-1 lg:grid-cols-[1fr_2.5fr] gap-3"
      >
        {/* ---------------- FORM ---------------- */}
        <GridItem>
          <VStack
            //   bg={theme.colors.formColor}
            className="bg-white items-stretch max-sm:p-4 p-4 rounded-lg border border-line"
          >
            <div className="mb-4 w-full text-lg tracking-tight text-ink">
              {editId ? 'Edit role' : 'Create role'}
            </div>
            <p className="-mt-2 mb-4 text-xs text-muted">
              Choose the details below, then save your changes.
            </p>

            <Fieldset.Root
              size="sm"
              className="w-full"
            >
              <Fieldset.Content>
                <DynamicForm
                  register={register}
                  formData={form}
                  focusNext={focusNext}
                  layout="verticalCombine"
                  labelFontSize="var(--font-sm)"
                  onChange={handleChange}
                  fields={roleMasterForm}
                />
              </Fieldset.Content>
            </Fieldset.Root>

            <HStack>
              <Button
                size="sm"
                disabled={isSubmitting}
                onClick={handleSave}
                className="bg-brand text-white"
              >
                <AiOutlineSave /> {editId ? 'Update' : 'Save'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={resetForm}
              >
                <IoIosExit /> Reset
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.back()}
              >
                <IoIosExit /> Exit
              </Button>
            </HStack>
          </VStack>
        </GridItem>

        {/* ---------------- TABLE ---------------- */}
        <GridItem className="min-w-0">
          <Box
            // bg={theme.colors.formColor}
            className="items-stretch max-sm:p-4 p-2 rounded-lg bg-white border border-line"
          >
            <Flex
              direction={{
                base: 'column',
                sm: 'row',
              }}
              className="justify-between items-start sm:items-center mb-2"
            >
              <HStack className="gap-2">
                <Text className="font-normal text-sm">
                  ROLE LIST
                </Text>
                <Badge
                  colorPalette="blue"
                  className="text-xs pl-2 pr-2 pt-0.5 pb-0.5 rounded-full"
                >
                  {totalElements} Total
                </Badge>
              </HStack>

              {/* <Flex gap={2} align="center">
                                <SearchBar searchTerm="" onChange={()=>console.log("")} size="xs" />
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    // color={theme.colors.green}
                                    _hover={{ color: "black" }}
                                    onClick={() => handleExport("excel")}
                                    aria-label="Export Excel"
                                >
                                    <FaFileExcel />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    color={theme.colors.primaryText}
                                    _hover={{ color: "black" }}
                                    onClick={() => handleExport("pdf")}
                                    aria-label="Export PDF"
                                >
                                    <FaPrint />
                                </Button>
                             </Flex> */}
            </Flex>

            <CustomTable
              columns={[
                {
                  key: 'SNO',
                  header: 'S.No',
                  render: (_row, index) => page * size + index + 1,
                },
                { key: 'ROLEID', header: 'Role Id', render: (role) => role.ROLEID },
                { key: 'ROLENAME', header: 'Role Name', render: (role) => role.ROLENAME },
                {
                  key: 'ACTIVE',
                  header: 'Active',
                  render: (role) => (
                    <Badge
                      colorScheme={role.ACTIVE === 'Y' ? 'green' : 'red'}
                      className="text-xs pl-2 pr-2 pt-0.5 pb-0.5 rounded-full"
                    >
                      {role.ACTIVE === 'Y' ? 'Yes' : 'No'}
                    </Badge>
                  ),
                },
                {
                  key: 'PWDACCESS',
                  header: 'Password Access',
                  render: (role) => (
                    <Badge
                      colorScheme={role.PWDACCESS === 'Y' ? 'green' : 'red'}
                      className="text-xs pl-2 pr-2 pt-0.5 pb-0.5 rounded-full"
                    >
                      {role.PWDACCESS === 'Y' ? 'Yes' : 'No'}
                    </Badge>
                  ),
                },
                {
                  key: 'ADMINACCESS',
                  header: 'Admin Access',
                  render: (role) => (
                    <Badge
                      colorScheme={role.ADMINACCESS === 'Y' ? 'green' : 'red'}
                      className="text-xs pl-2 pr-2 pt-0.5 pb-0.5 rounded-full"
                    >
                      {role.ADMINACCESS === 'Y' ? 'Yes' : 'No'}
                    </Badge>
                  ),
                },
              ]}
              data={paginatedRoles}
              showSearch={false}
              showPagination={false}
              rowKey="ROLEID"
              highlightRowId={highlightedId?.toString()}
              emptyMessage="No roles available"
              onRowClick={handleEdit}
            />
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
}
