import { FormField } from "@/types/form/form";

type UserRoleMasterFormConfig = {
    users: { label: string; value: string }[];
    roles: { label: string; value: string }[];
};

export const UserRoleMaster = (
    prop: UserRoleMasterFormConfig
): FormField[] => [
        {
            name: "USERID",
            label: "User",
        type: 'combobox',
        required: true,
        options: prop.users,
        placeholder: 'Select user',
        size: 'xs',
        },
        {
            name: "ROLEID",
            label: "Role name",
            type: 'combobox',
            required: true,
            options: prop.roles,
            placeholder: 'Select role',
            size: 'xs',
        },
    ];
