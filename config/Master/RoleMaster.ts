import { FormField } from "@/types/form/form";

type RoleMasterFormConfing = {
    yesOrNo : {label:string ; value :string}[]
}

export const RoleMaster = (prop:RoleMasterFormConfing):FormField[]  => [
    {
        name: "ROLENAME",
        label: "Role name",
        type: "text",
        size: "sm",
        rounded: "10px",
    },
    {
        name: "ACTIVE",
        label: "Active",
        type: "select",
        size: "sm",
        rounded: "10px",
        items: prop.yesOrNo

    },
    {
        name: "PWDACCESS",
        label: "Password access",
        type: "select",
        size: "sm",
        rounded: "10px",
        items: prop.yesOrNo
  
    },
    {
        name: "ADMINACCESS",
        label: "Admin access",
        type: "select",
        size: "sm",
        rounded: "10px",
        items: prop.yesOrNo
    },
];
