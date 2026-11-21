'use client';

import React, { useState, useEffect } from 'react';

/* ------------------ CHAKRA UI ------------------ */
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

/* ------------------ ICONS ------------------ */
import { AiOutlineSave } from 'react-icons/ai';
import { IoIosExit } from 'react-icons/io';
import { FaEdit, FaTrash, FaPrint, FaFileExcel } from 'react-icons/fa';

/* ------------------ COMPONENTS ------------------ */
import { Toaster, toaster } from '@/src/components/ui/toaster';
import scrollToTop from '@/src/components/scroll/ScrollToTop';
import { CustomTable } from '@/src/components/CustomTable';
import SearchBar from '@/src/components/search/SearchBar';
import { useEnterNavigation } from '@/src/components/form/useEnterNavigation';
import { DynamicForm } from '@/src/components/form/DynamicForm';

/* ------------------ CONTEXT ------------------ */
// import { useTheme } from "@/src/context/theme/themeContext";
// import { usePrint } from "@/src/context/print/usePrintContext";

/* ------------------ ROUTER ------------------ */
import { useRouter } from 'next/navigation';

/* ------------------ HOOKS ------------------ */
import { useUserRole } from '@/src/module/user-role/hook/use-user-role';

/* ------------------ SERVICES ------------------ */
import { fetchRoles } from '@/src/module/role-master/api/role-master.api';
import { OperatorService, Operator } from '@/src/module/user-role/api/operator.api';

/* ------------------ TYPES ------------------ */
import { UserRole, UserRolePayload } from '@/src/module/user-role/type/user-role.types';
import { Role } from '@/src/module/role-master/type/role-master.types';

/* ------------------ CONFIG ------------------ */
import { UserRoleMaster as UserRoleMasterConfig } from '@/src/module/user-role/type/user-role.config';
const UPUSERID = 1;
const emptyForm: UserRolePayload = {
  USERID: 0,
  ROLEID: 0,
  UPUSERID,
};

export default function UserRoleMaster() {
  // const { theme } = useTheme();
  const router = useRouter();
  // const { setData, setColumns, setShowSno, title } = usePrint();
  const { userRoles, loading, addUserRole, editUserRole, removeUserRole } = useUserRole();
  const [form, setForm] = useState<UserRolePayload>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const size = 10;

  // Load operators and roles for dropdowns
  useEffect(() => {
    OperatorService.getAll(0, 1000)
      .then((res) => setOperators(res?.content ?? []))
      .catch(console.error);
    fetchRoles().then(setRoles).catch(console.error);
  }, []);
  useEffect(() => {
    if (editId !== null) {
      const ur = userRoles.find((r: UserRole) => r.USERID === editId);
      if (ur) {
        setForm({
          USERID: ur.USERID,
          ROLEID: ur.ROLEID,
          UPUSERID,
        });
        scrollToTop();
      }
    }
  }, [editId]);
  useEffect(() => {
    if (!highlightedId) return;
    const t = setTimeout(() => setHighlightedId(null), 3000);
    return () => clearTimeout(t);
  }, [highlightedId]);
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);
  const getOperatorName = (id: number) =>
    operators.find((o) => o.OPER_CODE === id)?.OPER_NAME ?? String(id);
  const getRoleName = (id: number) =>
    roles.find((r) => r.ROLEID === id)?.ROLENAME ?? String(id);
  const handleChange = (field: keyof UserRolePayload, value: any) => {
    const safeValue = value?.target?.value ?? value?.value ?? value;
    setForm((prev) => ({
      ...prev,
      [field]: Number(safeValue),
    }));
  };
  const resetForm = () => {
    setEditId(null);
    setForm(emptyForm);
  };
  const handleEdit = (userRole: UserRole) => {
    setEditId(userRole.USERID);
  };
  const validateForm = () => {
    if (!form.USERID || form.USERID === 0) {
      toaster.error({
        title: 'Error',
        description: 'User is required',
      });
      return false;
    }
    if (!form.ROLEID || form.ROLEID === 0) {
      toaster.error({
        title: 'Error',
        description: 'Role is required',
      });
      return false;
    }
    const exists = (userRoles as UserRole[]).some(
      (ur) =>
        ur.USERID === form.USERID && ur.ROLEID === form.ROLEID && ur.USERID !== editId,
    );
    if (exists) {
      const userName =
        operators.find((o) => o.OPER_CODE === form.USERID)?.OPER_NAME ??
        String(form.USERID);
      const roleName =
        roles.find((r) => r.ROLEID === form.ROLEID)?.ROLENAME ?? String(form.ROLEID);
      toaster.error({
        title: 'Already Assigned',
        description: `"${roleName}" role is already assigned to "${userName}"`,
      });
      return false;
    }
    return true;
  };
  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const payload: UserRolePayload = {
        ...form,
        UPUSERID: 999,
      };
      if (editId !== null) {
        await editUserRole({
          id: editId,
          payload,
        });
        toaster.success({
          title: 'Success',
          description: 'User role updated successfully',
        });
      } else {
        const newUserRole = await addUserRole(payload);
        if ((newUserRole as any)?.USERID) {
          setHighlightedId((newUserRole as any).USERID);
        }
        toaster.success({
          title: 'Success',
          description: 'User role created successfully',
        });
      }
      resetForm();
    } catch (error: any) {
      toaster.error({
        title: 'Error',
        description: error?.message || 'Failed to save user role',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user role?')) return;
    try {
      await removeUserRole(id);
      toaster.success({
        title: 'Success',
        description: 'User role deleted successfully',
      });
      if (paginatedUserRoles.length === 1 && page > 0) setPage(page - 1);
    } catch (error: any) {
      toaster.error({
        title: 'Error',
        description: error?.message || 'Failed to delete user role',
      });
    }
  };

  // const handleExport = (option: string) => {
  //     setData((userRoles as UserRole[]).map((ur) => ({
  //         USERID: getOperatorName(ur.USERID),
  //         ROLEID: getRoleName(ur.ROLEID),
  //     })));
  //     setColumns([
  //         { key: "USERID", label: "User" },
  //         { key: "ROLEID", label: "Role" },
  //     ]);
  //     setShowSno(true);
  //     title?.("User Role Master");
  //     router.push(`/print?export=${option}`);
  // };

  const filteredUserRoles = (userRoles as UserRole[]).filter(
    (ur) =>
      getOperatorName(ur.USERID).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getRoleName(ur.ROLEID).toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const totalElements = filteredUserRoles.length;
  const paginatedUserRoles = filteredUserRoles.slice(page * size, (page + 1) * size);
  const operatorItems = operators.map((o) => ({
    label: o.OPER_NAME,
    value: String(o.OPER_CODE),
  }));
  const roleItems = roles.map((r) => ({
    label: r.ROLENAME,
    value: String(r.ROLEID),
  }));
  const UserRoleFields = UserRoleMasterConfig({
    users: operatorItems,
    roles: roleItems,
  });
  const formNames = UserRoleFields.map((f) => f.name);
  const { register, focusFirst, focusNext } = useEnterNavigation(formNames, handleSave);
  if (loading) {
    return (
      <Box className="flex justify-center items-center min-h-screen">
        <Spinner
          size="xl"
          // color={theme.colors.accient}
        />
      </Box>
    );
  }
  return (
    <Box className="[&_table]:w-full [&_table]:border-collapse [&_th]:bg-slate-50 [&_th]:px-3.5 [&_th]:py-row [&_th]:text-xs [&_th]:tracking-wide [&_th]:text-muted [&_th]:uppercase [&_td]:border-b [&_td]:border-slate-100 [&_td]:px-3.5 [&_td]:py-row [&_td]:text-sm [&_tbody_tr:hover]:bg-brand-soft [&_button]:min-h-9 [&_button]:rounded-lg [&_[role=tab]]:min-h-11 [&_[role=tab][data-selected]]:bg-brand-soft [&_[role=tab][data-selected]]:text-brand font-normal">
      <Toaster />
      <Grid className="grid-cols-1 lg:grid-cols-[1fr_2.5fr] gap-3">
        <GridItem>
          <VStack
            // bg={theme.colors.formColor}
            className="bg-white items-stretch max-sm:p-4 p-4 rounded-lg border border-line"
          >
            <div className="mb-4 w-full text-lg tracking-tight text-ink">
              {editId ? 'Edit assignment' : 'Create assignment'}
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
                  fields={UserRoleFields}
                  minLabelWidth="70px"
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

        {/* TABLE */}
        <GridItem className="min-w-0">
          <Box
            // bg={theme.colors.formColor}
            className="items-stretch max-sm:p-4 p-3 rounded-lg bg-white border border-line"
          >
            {/* <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "start", sm: "center" }} mb={3} gap={2}>
                            <HStack gap={2}>
                                <Text fontWeight="semibold" fontSize="small">USER ROLE LIST</Text>
                                <Badge colorPalette="blue" fontSize="2xs" px={2} py={0.5} borderRadius="full">
                                    {totalElements} Total
                                </Badge>
                            </HStack>
                            <Flex gap={2} align="center">
                                <SearchBar
                                    searchTerm={searchTerm}
                                    onChange={setSearchTerm}
                                    size="xs"
                                />
                                <Button variant="ghost" size="xs" color={theme.colors.green} onClick={() => handleExport("excel")}>
                                    <FaFileExcel />
                                </Button>
                                <Button variant="ghost" size="xs" color={theme.colors.primaryText} onClick={() => handleExport("pdf")}>
                                    <FaPrint />
                                </Button>
                            </Flex>
                         </Flex> */}

            <CustomTable
              columns={[
                {
                  key: 'SNO',
                  header: 'S.No',
                  render: (_row, index) => page * size + index + 1,
                },
                {
                  key: 'USERID',
                  header: 'User',
                  render: (ur) => getOperatorName(ur.USERID),
                },
                { key: 'ROLEID', header: 'Role', render: (ur) => getRoleName(ur.ROLEID) },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (ur) => (
                    <Box className="flex gap-2">
                      <FaTrash
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(ur.USERID);
                        }}
                        size={14}
                        className="cursor-pointer text-red-600"
                      />
                    </Box>
                  ),
                },
              ]}
              data={paginatedUserRoles}
              showSearch={false}
              showPagination={false}
              rowKey="USERID"
              highlightRowId={highlightedId}
              emptyMessage="No user role assignments available"
              onRowClick={handleEdit}
            />
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
}
