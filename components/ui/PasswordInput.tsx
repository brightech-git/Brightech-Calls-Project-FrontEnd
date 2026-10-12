"use client";

import { ui } from "@/utils/ui";
import * as React from "react";
import { Input, IconButton, InputProps, Box } from "@chakra-ui/react";
import { FiMenu, FiEye, FiEyeOff } from "react-icons/fi";
export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(function PasswordInput(props, ref) {
  const [show, setShow] = React.useState(false);
  return <Box className={ui("[position:relative]! [width:100%]!")}>
                <Input ref={ref} type={show ? "text" : "password"} {...props} className={ui("form-control " + ui("[padding-right:3rem]! [min-height:var(--control-height)]! [font-size:var(--font-sm)]! [border-radius:10px]!"))} />

                <IconButton type="button" aria-label={show ? "Hide password" : "Show password"} size="sm" variant="ghost" onClick={() => setShow(!show)} className={ui("[position:absolute]! [right:0.25rem]! [top:50%]! [transform:translateY(-50%)]!")}>    {show ? <FiEye /> : <FiEyeOff />} </IconButton>
            </Box>;
});
