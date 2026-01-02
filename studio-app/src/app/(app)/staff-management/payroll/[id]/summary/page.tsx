"use client";

import { useEffect, useState } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { getPayroll, updatePayroll } from "@/services/payrollService";
import { getSettings } from "@/services/settingsService";
import { getStaffMember } from "@/services/staffService";
import type { Payroll, Payslip, SchoolSettings, Staff } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Printer, ArrowLeft, FileDown, CheckCircle2, Edit } from "lucide-react";
import { format } from "date-fns";

export default function PayrollSummaryPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();
    const payrollId = params?.id as string | undefined;

    const [payroll, setPayroll] = useState<Payroll | null>(null);
    const [settings, setSettings] = useState<SchoolSettings | null>(null);
    const [staffMembers, setStaffMembers] = useState<Record<string, Staff>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [showPrintAll, setShowPrintAll] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState<string>("");

    useEffect(() => {
        if (!payrollId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [payrollData, settingsData] = await Promise.all([
                    getPayroll(payrollId),
                    getSettings()
                ]);

                if (!payrollData || !settingsData) {
                    notFound();
                    return;
                }
                
                const staffMap: Record<string, Staff> = {};
                for (const payslip of payrollData.payslips) {
                    if (!staffMap[payslip.staffId]) {
                        try {
                            const staff = await getStaffMember(payslip.staffId);
                            if (staff) staffMap[payslip.staffId] = staff;
                        } catch (e) {
                            // Continue if staff member not found
                        }
                    }
                }
                
                setPayroll(payrollData);
                setSettings(settingsData);
                setStaffMembers(staffMap);

            } catch (error) {
                toast({ title: "خطأ", description: "فشل في جلب بيانات الرواتب", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [payrollId, toast]);

    const handlePrint = () => {
        window.print();
    }

    const handlePrintSelection = () => {
        if (!selectedStaffId) return;
        
        if (selectedStaffId === "all") {
            setShowPrintAll(true);
            setTimeout(() => {
                window.print();
            }, 100);
        } else {
            window.open(`/staff-management/payroll/${payrollId}/payslip/${selectedStaffId}`, '_blank');
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(amount);
    }

    const handleDownloadPDF = () => {
        window.print();
        // PDF download would be handled by print dialog
    }

    const handleConfirmPayroll = async () => {
        console.log("handleConfirmPayroll called, payrollId:", payrollId);
        if (!payrollId || !payroll) {
            console.log("No payrollId or payroll, returning");
            return;
        }
        try {
            console.log("Calling updatePayroll with status: paid");
            // Update payroll status to paid
            const result = await updatePayroll(payrollId, { status: "paid" });
            console.log("updatePayroll result:", result);
            
            if (result.success) {
                console.log("Payment confirmation successful");
                // Update local state immediately
                setPayroll({...payroll, status: "paid"});
                
                toast({ 
                    title: "✅ تم التأكيد بنجاح", 
                    description: `تم تأكيد رواتب ${payroll?.period} وتحديث حالة الدفع إلى "مدفوع". لن تظهر هذه الرواتب في تقرير المستحقات.`, 
                    variant: "default",
                    duration: 5000
                });
                // Refresh the page to reflect status change
                setTimeout(() => router.refresh(), 1500);
            } else {
                console.log("Payment confirmation failed:", result.reason);
                toast({ 
                    title: "❌ خطأ في التأكيد", 
                    description: result.reason || "فشل في تأكيد الرواتب", 
                    variant: "destructive",
                    duration: 4000
                });
            }
        } catch (error) {
            console.error("Error in handleConfirmPayroll:", error);
            toast({ 
                title: "❌ خطأ", 
                description: error instanceof Error ? error.message : "فشل في تأكيد الرواتب. الرجاء المحاولة مرة أخرى.", 
                variant: "destructive",
                duration: 4000
            });
        }
    }

    const handleEdit = () => {
        router.push(`/staff-management/payroll/${payrollId}/edit`);
    }
    
    if (isLoading || !payroll || !settings) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    const totalGross = payroll.payslips.reduce((sum, p) => sum + (p.grossSalary || 0), 0);
    const totalDeductions = payroll.payslips.reduce((sum, p) => sum + (p.totalDeductions || 0), 0);
    const totalNet = payroll.payslips.reduce((sum, p) => sum + p.netPay, 0);

    return (
        <>
        <style>{`
            :root {
                --primary: #2c5aa0;
                --primary-light: #e8eff9;
                --secondary: #1a7b5c;
                --danger: #dc3545;
                --success: #28a745;
                --light: #f8f9fa;
                --dark: #343a40;
                --border: #dee2e6;
                --sidebar-bg: #2c3e50;
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Cairo', 'Segoe UI', 'Noto Sans Arabic', Tahoma, sans-serif;
            }

            body {
                display: flex;
                min-height: 100vh;
                background-color: #f5f7fa;
                color: #333;
            }

            .payroll-admin-wrapper {
                width: 100%;
                display: flex;
                flex-direction: column;
                background: #f5f7fa;
                min-height: 100vh;
            }

            .admin-header {
                background: white;
                padding: 25px 40px;
                border-bottom: 2px solid #dee2e6;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .header-left {
                display: flex;
                align-items: center;
                gap: 20px;
            }

            .page-title h1 {
                font-size: 1.8rem;
                color: #2c5aa0;
                margin-bottom: 5px;
            }

            .page-subtitle {
                color: #666;
                font-size: 0.95rem;
            }

            .date-badge {
                background: #e8eff9;
                color: #2c5aa0;
                padding: 10px 20px;
                border-radius: 50px;
                font-weight: 600;
                font-size: 0.95rem;
                border: 1px solid rgba(44, 90, 160, 0.2);
            }

            .admin-content {
                flex: 1;
                padding: 30px 40px;
                overflow-y: auto;
                direction: rtl;
            }

            .summary-boxes {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .summary-box {
                background: white;
                border-radius: 12px;
                padding: 24px;
                text-align: center;
                border: 1px solid #dee2e6;
                transition: transform 0.3s;
                box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            }

            .summary-box:hover {
                transform: translateY(-5px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }

            .summary-box.gross {
                border-top: 5px solid #2c5aa0;
            }

            .summary-box.deductions {
                border-top: 5px solid #dc3545;
            }

            .summary-box.net {
                border-top: 5px solid #28a745;
            }

            .summary-label {
                font-size: 0.95rem;
                color: #666;
                margin-bottom: 12px;
            }

            .summary-value {
                font-size: 2.2rem;
                font-weight: 700;
                margin-bottom: 5px;
            }

            .summary-box.gross .summary-value { color: #2c5aa0; }
            .summary-box.deductions .summary-value { color: #dc3545; }
            .summary-box.net .summary-value { color: #28a745; }

            .summary-note {
                font-size: 0.85rem;
                color: #888;
                margin-top: 5px;
            }

            .section-title {
                font-size: 1.3rem;
                margin-bottom: 20px;
                color: #2c3e50;
                padding-bottom: 10px;
                border-bottom: 2px solid #dee2e6;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .details-table {
                width: 100%;
                border-collapse: collapse;
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 3px 10px rgba(0,0,0,0.04);
                margin-bottom: 25px;
            }

            .details-table th {
                background: #e8eff9;
                color: #2c5aa0;
                padding: 16px 20px;
                text-align: right;
                font-weight: 600;
                border-bottom: 2px solid #dee2e6;
                font-size: 0.95rem;
            }

            .details-table td {
                padding: 14px 20px;
                border-bottom: 1px solid #f0f0f0;
                text-align: right;
                font-size: 0.95rem;
            }

            .details-table tr:last-child td {
                border-bottom: none;
            }

            .details-table tr:hover {
                background-color: #f9f9f9;
            }

            .deduction-amount {
                color: #dc3545;
                font-weight: 600;
            }

            .income-amount {
                color: #28a745;
                font-weight: 600;
            }

            .action-buttons {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                margin-top: 30px;
            }

            .btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 11px 24px;
                border-radius: 8px;
                font-weight: 600;
                border: none;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 0.95rem;
            }

            .btn-primary {
                background: #2c5aa0;
                color: white;
            }

            .btn-primary:hover {
                background: #1a365d;
                box-shadow: 0 4px 12px rgba(44, 90, 160, 0.3);
            }

            .btn-success {
                background: #28a745;
                color: white;
            }

            .btn-success:hover {
                background: #218838;
            }

            .btn-secondary {
                background: #f8f9fa;
                color: #343a40;
                border: 1px solid #dee2e6;
            }

            .btn-secondary:hover {
                background: #e9ecef;
            }

            .print-controls {
                background: white;
                padding: 20px 40px;
                border-bottom: 2px solid #dee2e6;
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .print-select {
                min-width: 280px;
                padding: 10px 15px;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                font-size: 0.95rem;
                cursor: pointer;
            }

            @media print {
                .admin-header, .print-controls, .action-buttons { display: none !important; }
                .payroll-admin-wrapper { background: white; }
                .admin-content { padding: 0; }
            }

            @media (max-width: 768px) {
                .admin-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 15px;
                }
                .summary-boxes {
                    grid-template-columns: 1fr;
                }
                .details-table th, .details-table td {
                    padding: 12px 15px;
                    font-size: 0.85rem;
                }
                .admin-content {
                    padding: 20px;
                }
            }
        `}</style>

        <div className="payroll-admin-wrapper">
            {/* HEADER */}
            <div className="admin-header">
                <div className="header-left">
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => router.back()}
                        style={{minWidth: 'auto', padding: '8px 12px'}}
                    >
                        <ArrowLeft size={18} /> عودة
                    </button>
                    <div className="page-title">
                        <h1>ملخص الرواتب</h1>
                        <p className="page-subtitle">{payroll.period} | {format(new Date(payroll.runDate), "PPP")}</p>
                    </div>
                </div>
                <div className="date-badge">
                    📅 {format(new Date(payroll.runDate), "PPP")}
                </div>
            </div>

            {/* PRINT CONTROLS */}
            <div className="print-controls">
                <label style={{fontSize: '0.9rem', fontWeight: 600}}>اختر موظفًا للطباعة:</label>
                <select 
                    className="print-select"
                    value={selectedStaffId} 
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                >
                    <option value="">-- اختر --</option>
                    <option value="all">📋 طباعة جميع القسائم</option>
                    <optgroup label="الموظفون">
                        {payroll.payslips.map((payslip) => (
                            <option key={payslip.staffId} value={payslip.staffId}>
                                {payslip.staffName}
                            </option>
                        ))}
                    </optgroup>
                </select>
                <button 
                    className="btn btn-primary"
                    onClick={handlePrintSelection}
                    disabled={!selectedStaffId}
                    style={{opacity: selectedStaffId ? 1 : 0.5, cursor: selectedStaffId ? 'pointer' : 'not-allowed'}}
                >
                    <Printer size={18} /> طباعة
                </button>
            </div>

            {/* MAIN CONTENT */}
            <div className="admin-content">
                {/* SUMMARY BOXES */}
                <div className="summary-boxes">
                    <div className="summary-box gross">
                        <div className="summary-label">إجمالي الرواتب | Total Gross</div>
                        <div className="summary-value">{formatCurrency(totalGross)}</div>
                        <div className="summary-note">Salaire Brut</div>
                    </div>
                    <div className="summary-box deductions">
                        <div className="summary-label">إجمالي الاستقطاعات | Total Deductions</div>
                        <div className="summary-value">{formatCurrency(totalDeductions)}</div>
                        <div className="summary-note">CNSS + AMO + IR</div>
                    </div>
                    <div className="summary-box net">
                        <div className="summary-label">إجمالي الصافي | Total Net</div>
                        <div className="summary-value">{formatCurrency(totalNet)}</div>
                        <div className="summary-note">Salaire Net</div>
                    </div>
                </div>

                {/* PAYROLL TABLE */}
                <h3 className="section-title">📊 تفاصيل الرواتب | Payroll Details</h3>
                <table className="details-table">
                    <thead>
                        <tr>
                            <th style={{ width: "25%" }}>اسم الموظف | Name</th>
                            <th style={{ width: "20%" }}>الراتب الأساسي | Gross</th>
                            <th style={{ width: "20%" }}>الاستقطاعات | Deductions</th>
                            <th style={{ width: "20%" }}>الصافي | Net</th>
                            <th style={{ width: "15%" }}>الإجراءات | Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payroll.payslips.map((p) => (
                            <tr key={p.staffId}>
                                <td><strong>{p.staffName}</strong></td>
                                <td className="income-amount">{formatCurrency(p.grossSalary || 0)}</td>
                                <td className="deduction-amount">{formatCurrency(p.totalDeductions || 0)}</td>
                                <td style={{fontWeight: 600, color: '#28a745'}}>{formatCurrency(p.netPay)}</td>
                                <td>
                                    <button 
                                        className="btn btn-secondary"
                                        onClick={() => window.open(`/staff-management/payroll/${payrollId}/payslip/${p.staffId}`, '_blank')}
                                        style={{minWidth: 'auto', padding: '6px 12px', fontSize: '0.8rem'}}
                                    >
                                        <FileDown size={14} /> عرض
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* SUMMARY SECTION */}
                <h3 className="section-title" style={{marginTop: '40px'}}>📋 ملخص الفترة | Period Summary</h3>
                <table className="details-table">
                    <thead>
                        <tr>
                            <th style={{ width: "40%" }}>البند | Item</th>
                            <th style={{ width: "30%" }}>الوصف | Description</th>
                            <th style={{ width: "30%" }}>المبلغ | Amount (DH)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>عدد الموظفين</strong></td>
                            <td>Staff Count</td>
                            <td style={{fontWeight: 600}}>{payroll.payslips.length}</td>
                        </tr>
                        <tr>
                            <td><strong>إجمالي الرواتب الأساسية</strong></td>
                            <td>Total Gross Salary</td>
                            <td className="income-amount">{formatCurrency(totalGross)}</td>
                        </tr>
                        <tr>
                            <td><strong>إجمالي الاستقطاعات</strong></td>
                            <td>Total Deductions</td>
                            <td className="deduction-amount">{formatCurrency(totalDeductions)}</td>
                        </tr>
                        <tr style={{background: '#f8f9fa', fontWeight: 700}}>
                            <td><strong>الإجمالي المستحق للتحويل</strong></td>
                            <td>Total Amount to Transfer</td>
                            <td style={{color: '#28a745'}}>{formatCurrency(totalNet)}</td>
                        </tr>
                    </tbody>
                </table>

                {/* ACTION BUTTONS */}
                <div className="action-buttons">
                    <button className="btn btn-primary" onClick={handleDownloadPDF}>
                        <FileDown size={18} /> تحميل PDF
                    </button>
                    <button className="btn btn-success" onClick={handleConfirmPayroll}>
                        <CheckCircle2 size={18} /> تأكيد الرواتب
                    </button>
                    <button className="btn btn-secondary" onClick={handleEdit}>
                        <Edit size={18} /> تعديل
                    </button>
                </div>
            </div>
        </div>
        </>
    );
}
