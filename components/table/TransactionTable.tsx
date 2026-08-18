import React, { useRef } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { PlusCircle, Edit2, Save, XCircle, Trash2, RefreshCcw } from "lucide-react";
import { COLORS, FONT } from "@/utils/theme";


interface Column {
    key: string;
    label: string;
    align?: 'left' | 'center' | 'right';
    decimalScale?: number;
}

export interface FormField {
    key: string;
    type: string;
    isRequired?: boolean;
    label?: string;
    placeholder?: string;
    collection?: any;
    disabled?: boolean;
    dependsOn?: string;
    decimalScale?: number;
}

interface TransactionTableProps {
    theme?: {
        colors?: {
            borderColor?: string;
            formColor?: string;
        };
    };
    tableCols: Column[];
    formFields: FormField[];
    rows: any[];
    formData?: Record<string, any>;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
    localEditId: string | null;
    isSubmitting: boolean;
    totals?: Record<string, number>;
    stripedBg?: string;
    allDisplayCols: Column[];
    isIssue?: boolean;
    getCellStyle?:any;

    // Handlers
    resetForm: () => void;
    handleSubmit: () => void;
    handleEditRow: (row: any, tranType:string|undefined) => void;
    handleDeleteRow: (row: any) => void;
    renderFormCell: any;
    getCellValue: (col: Column, row: any) => React.ReactNode;
    formatTotal: (value: number | undefined, decimals?: number) => string;
    transactionType?:string;
    showTotal?:boolean;
    showTableForm?:boolean;
    formBackground?:string;
    totalBG?:string;
    totalColor?:string;


    //Height
    maxBodyHeight?:string
}


export const TransactionTable: React.FC<TransactionTableProps> = ({
    theme,
    tableCols,
    formFields,
    rows,
    // formData,
    errors,
    touched,
    localEditId,
    isSubmitting,
    totals,
    stripedBg = '#F7FAFC',
    allDisplayCols,
    // isIssue,
    resetForm,
    handleSubmit,
    handleEditRow,
    handleDeleteRow,
    renderFormCell,
    getCellValue,
    formatTotal,
    getCellStyle,
    transactionType,
    showTotal = true,
    showTableForm=true,
    formBackground = '#FFF',
    totalBG='#888',
    totalColor ='#FFF',
    maxBodyHeight = '250px',

}) => {

    const submitBtnRef = useRef<HTMLButtonElement>(null);



    const enableScroll = rows.length > 10;
    const rowHeight = 40; // approx for size="sm"
    
    return (
        <Box
            borderWidth="1px"
            borderColor={theme?.colors?.borderColor || COLORS.gray300}
            borderRadius="md"
            overflow="hidden"
            bg="white"
            zIndex={0}


        >
            <Box overflowX="auto" 
                 position="relative" 
                 maxH={enableScroll ? `${maxBodyHeight}` : "auto"}
                 overflowY={enableScroll ? "auto" : "visible"}>
                <table style={{
                    tableLayout: "fixed",
                    borderCollapse: "collapse",
                    width: "max-content",
                    minWidth: "100%",
                

                }}>
                    {/* HEADER */}
                    <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                        <tr style={{
                            backgroundColor: formBackground || "#EDF2F7",
                            borderBottom: "1px solid #DEDEDE",
                            
                           
                        }}>
                            <th style={getCellStyle({ key: "__sno", label: "#", align: "center" }, { fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, color: COLORS.textSecondary, padding: "5px 3px" })}>
                                S.NO
                            </th>
                            {tableCols.map(col => {
                                const fld = formFields.find(f => f.key === col.key);

                                return (
                                    <th
                                        key={col.key}
                                        style={getCellStyle(col, {
                                            fontSize: FONT.size.xs,
                                            fontWeight: FONT.weight.bold,
                                            color: COLORS.textSecondary,
                                            padding: "5px 3px",
                                            textAlign: "center",   // 👈 add this

                                        })}
                                    >
                                        {col.label}
                                        {fld?.isRequired && (
                                            <span style={{ color: COLORS.error, marginLeft: 2 }}>*</span>
                                        )}
                                    </th>
                                );
                            })}
                            <th style={getCellStyle({ key: "__actions", label: "ACT", align: "center" }, { fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, color: COLORS.textSecondary, padding: "5px 3px" ,width:'50px' })}>
                                {localEditId ? (
                                    <button
                                        onClick={resetForm}
                                        title="Cancel Edit"
                                        style={{
                                            fontSize: FONT.size.xs,
                                            color: COLORS.error,
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            fontWeight: FONT.weight.bold,

                                        }}
                                    >
                                       <XCircle size={14}/>
                                    </button>
                                ) : "ACT"}
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* FORM ROW */}
                        {showTableForm && (
                            <tr style={{
                               position: "sticky", top:25, zIndex: 10 ,
                                backgroundColor: localEditId ? "#EBF8FF" : "#FAFAFA",
                                borderBottom: "2px solid #CBD5E0",
                            }}>
                                <td style={getCellStyle({ key: "__sno", label: "#", align: "center" }, { fontSize: FONT.size.xs })}>
                                    {localEditId ? (
                                        <span style={{ color: COLORS.primary, fontWeight: 900, fontSize: FONT.size.sm }}>✎</span>
                                    ) : (
                                        <span style={{ color: COLORS.gray300, fontSize: FONT.size.xs }}>{rows.length + 1}</span>
                                    )}
                                </td>

                                {tableCols.map(col => {
                                    const field = formFields.find(f => f.key === col.key);
                                    const hasErr = !!errors[col.key] && !!touched[col.key];
                                    return (
                                        <td
                                            key={col.key}
                                            style={{
                                                ...getCellStyle(col),
                                                backgroundColor: hasErr ? COLORS.errorBg : undefined,
                                                outline: hasErr ? `1px solid ${COLORS.error}` : undefined,
                                                position: "relative",
                                            }}
                                            title={hasErr ? errors[col.key] : undefined}
                                        >
                                            {field ? renderFormCell(field) : null}
                                        </td>
                                    );
                                })}

                                <td style={getCellStyle({ key: "__actions", label: "ACT", align: "center" }, { padding: "2px" })}>
                                    <button
                                        ref={submitBtnRef}
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        title={localEditId ? "Update Row" : "Add Row"}

                                        style={{
                                            width: "100%",
                                            height: 22,
                                            background: localEditId ? COLORS.primary : COLORS.success,
                                            color: "white",
                                            border: "none",
                                            borderRadius: 4,
                                            cursor: isSubmitting ? "not-allowed" : "pointer",
                                            fontSize: FONT.size.xs,
                                            fontWeight: FONT.weight.bold,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            opacity: isSubmitting ? 0.7 : 1,

                                        }}
                                    >
                                        {isSubmitting ? "..." : localEditId ? <Save size={14} /> : <Save size={14} />}
                                    </button>
                                </td>
                            </tr>
                        )}
                       

                      

                        {/* empty state */}
                        {rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={allDisplayCols.length}
                                    style={{
                                        textAlign: "center",
                                        padding: "14px",
                                        fontSize: FONT.size.xs,
                                        color: COLORS.gray300
                                    }}
                                >
                                    No items added yet — fill the form above and click + ADD
                                </td>
                            </tr>
                        )}

                        {/* DATA ROWS */}
                        {rows.map((row, idx) => (
                            <tr
                                key={row.__rowId || idx}
                                style={{
                                    backgroundColor: row.__rowId === localEditId
                                        ? COLORS.primaryLight
                                        : idx % 2 === 0 ? stripedBg : "white",
                                    borderBottom: `1px solid ${COLORS.gray200}`,
                                    transition: "background-color 0.15s",
                                }}
                            >
                                <td style={getCellStyle({ key: "__sno", label: "#", align: "center" }, { fontSize: FONT.size.sm, color: COLORS.textMuted })}>
                                    {idx + 1}
                                </td>
                                {tableCols.map(col => (
                                    <td key={col.key} style={getCellStyle(col, { fontSize: FONT.size.sm, color: COLORS.textPrimary, whiteSpace: "nowrap" })}>
                                        {getCellValue(col, row)}
                                    </td>
                                ))}
                                <td style={getCellStyle({ key: "__actions", label: "ACT", align: "center" })}>
                                    <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditRow(row,transactionType);
                                            }}
                                            title="Edit"
                                            style={{
                                                padding: 2,
                                                color: COLORS.primary,
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteRow(row);
                                            }}
                                            title="Delete"
                                            style={{
                                                padding: 2,
                                                color: COLORS.error,
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>

                    {/* totals footer */}
                    {rows.length > 0 && showTotal && (
                        <tfoot style={{ position: "sticky", bottom: 0, zIndex: 10 , }}>
                            
                            <tr   style={{ backgroundColor: totalBG ??"#A0AEC0" , color:totalColor ?? "black" }}>
                                
                                <td style={getCellStyle({ key: "__sno", label: "#", align: "left" }, { fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold,})}>
                                    TOTAL
                                </td>
                                {tableCols.map(col => (
                                    <td key={col.key} style={getCellStyle(col, { fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold})}>
                                        {formatTotal(totals?.[col.key], col.decimalScale)}
                                    </td>
                                ))}
                                <td style={getCellStyle({ key: "__actions", label: "ACT", align: "center" })} />
                            </tr>
                        </tfoot>
                    )}
                </table>
            </Box>
        </Box>
    );
};

export default TransactionTable;