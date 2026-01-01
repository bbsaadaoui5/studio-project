"use client";

import { useEffect, useState } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { getPayroll } from "@/services/payrollService";
import { getStaffMember } from "@/services/staffService";
import { getSettings } from "@/services/settingsService";
import type { Payroll, Payslip, Staff, SchoolSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Download, Printer } from "lucide-react";
import { format } from "date-fns";

// Helper function to format staff ID
const formatStaffId = (id: string, role?: string): string => {
  // If it's already in STAFF#### format, extract the number
  if (id.startsWith('STAFF')) {
    return id.slice(-4); // e.g., "1001" from "STAFF1001"
  }
  
  // For Firebase auth IDs, extract numeric part
  const numericId = id.replace(/\D/g, '');
  const shortId = numericId.slice(-3).padStart(3, '0');
  let prefix = "ST";
  
  if (role === "admin") prefix = "ST";
  else if (role === "teacher") prefix = "TH";
  else if (role === "support") prefix = "SP";
  
  return `${prefix}${shortId}`;
};

export default function PayslipPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();
    const payrollId = params?.id as string | undefined;
    const staffId = params?.staffId as string | undefined;

    const [payslip, setPayslip] = useState<Payslip | null>(null);
    const [payroll, setPayroll] = useState<Payroll | null>(null);
    const [staff, setStaff] = useState<Staff | null>(null);
    const [settings, setSettings] = useState<SchoolSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!payrollId || !staffId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [payrollData, staffData, settingsData] = await Promise.all([
                    getPayroll(payrollId),
                    getStaffMember(staffId),
                    getSettings()
                ]);

                if (!payrollData || !staffData || !settingsData) {
                    notFound();
                    return;
                }

                const payslipData = payrollData.payslips.find(p => p.staffId === staffId);
                if (!payslipData) {
                    notFound();
                    return;
                }
                
                setPayroll(payrollData);
                setStaff(staffData);
                setPayslip(payslipData);
                setSettings(settingsData);

            } catch (error) {
                toast({ title: "خطأ", description: "فشل في جلب بيانات قسيمة الراتب.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [payrollId, staffId, toast]);

    const handlePrint = () => {
        window.print();
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(amount);
    }
    
    if (isLoading || !payslip || !payroll || !staff || !settings) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    const parsePeriod = (period: string) => {
        const months: Record<string, number> = {
            january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
            july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
        };
        const parts = period.trim().split(/\s+/);
        let monthIdx = -1; let year = NaN;
        if (parts.length >= 2) {
            const m = parts[0].toLowerCase();
            if (months[m] !== undefined) monthIdx = months[m];
            year = parseInt(parts[1], 10);
        }
        let start: Date; let end: Date;
        if (monthIdx === -1 || !Number.isFinite(year)) {
            const tentative = new Date(`${period} 1`);
            if (!isNaN(tentative.getTime())) {
                start = new Date(tentative.getFullYear(), tentative.getMonth(), 1);
                end = new Date(tentative.getFullYear(), tentative.getMonth() + 1, 0);
            } else {
                const now = new Date();
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            }
        } else {
            start = new Date(year, monthIdx, 1);
            end = new Date(year, monthIdx + 1, 0);
        }
        return { start, end };
    };

    const countWorkingDays = (start: Date, end: Date) => {
        let count = 0;
        const current = new Date(start);
        while (current <= end) {
            const dayOfWeek = current.getDay();
            // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            // Count Monday (1) through Friday (5) — Moroccan 5-day work week
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
    };

    const { start: pStart, end: pEnd } = parsePeriod(payroll.period);
    const totalWorkingDays = countWorkingDays(pStart, pEnd);
    let daysWorked = totalWorkingDays;
    if (staff.hireDate) {
        const hire = new Date(staff.hireDate);
        if (!isNaN(hire.getTime())) {
            if (hire > pEnd) daysWorked = 0; else {
                const effectiveStart = hire > pStart ? hire : pStart;
                daysWorked = countWorkingDays(effectiveStart, pEnd);
            }
        }
    }

    return (
        <>
        <style>{`
            :root {
                --primary: #1a365d;
                --secondary: #2c5282;
                --light-bg: #f7fafc;
                --border: #e2e8f0;
                --text: #2d3748;
                --text-light: #718096;
                --danger: #e53e3e;
                --success: #38a169;
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Cairo', 'Segoe UI', 'Noto Sans Arabic', Tahoma, sans-serif;
            }

            .payslip-wrapper {
                background: #f5f7fa;
                padding: 30px;
                direction: rtl;
                min-height: 100vh;
            }

            .action-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                gap: 15px;
            }

            .action-bar button {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 20px;
                border-radius: 8px;
                border: none;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }

            .btn-back {
                background: white;
                color: #2d3748;
                border: 1px solid #e2e8f0;
            }

            .btn-back:hover {
                background: #f7fafc;
            }

            .btn-print {
                background: #1a365d;
                color: white;
            }

            .btn-print:hover {
                background: #2c5282;
            }

            .payslip-container {
                max-width: 1000px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                overflow: hidden;
            }

            .payslip-header {
                background: linear-gradient(135deg, #1a365d, #2c5282);
                color: white;
                padding: 30px 40px;
                position: relative;
                overflow: hidden;
            }

            .header-pattern {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 0.1;
                background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
            }

            .header-content {
                position: relative;
                z-index: 2;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .institution-info h1 {
                font-size: 1.8rem;
                margin-bottom: 5px;
                font-weight: 700;
            }

            .institution-info p {
                opacity: 0.9;
                font-size: 0.95rem;
            }

            .payslip-title h2 {
                font-size: 2rem;
                font-weight: 800;
                margin-bottom: 8px;
            }

            .payslip-title p {
                opacity: 0.9;
                font-size: 0.95rem;
            }

            .info-section {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 25px;
                padding: 30px 40px;
                background: #f7fafc;
                border-bottom: 2px solid #e2e8f0;
            }

            .info-card {
                background: white;
                padding: 20px;
                border-radius: 10px;
                border: 1px solid #e2e8f0;
            }

            .info-card h3 {
                color: #1a365d;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e2e8f0;
                font-size: 1.1rem;
            }

            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                padding-bottom: 10px;
                border-bottom: 1px dashed #eee;
            }

            .info-row:last-child {
                margin-bottom: 0;
                padding-bottom: 0;
                border-bottom: none;
            }

            .info-label {
                color: #718096;
                font-weight: 500;
                font-size: 0.9rem;
            }

            .info-value {
                color: #2d3748;
                font-weight: 600;
                text-align: left;
            }

            .salary-section {
                padding: 35px 40px;
            }

            .section-title {
                font-size: 1.3rem;
                color: #1a365d;
                margin-bottom: 20px;
                padding-bottom: 12px;
                border-bottom: 3px solid #e2e8f0;
            }

            .breakdown-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
                gap: 30px;
                margin-bottom: 30px;
            }

            .breakdown-box {
                background: #f7fafc;
                border-radius: 12px;
                padding: 25px;
                border: 1px solid #e2e8f0;
            }

            .breakdown-box.earnings {
                border-top: 5px solid #38a169;
            }

            .breakdown-box.deductions {
                border-top: 5px solid #e53e3e;
            }

            .breakdown-box h4 {
                margin-bottom: 15px;
                font-size: 1.1rem;
            }

            .breakdown-box.earnings h4 {
                color: #38a169;
            }

            .breakdown-box.deductions h4 {
                color: #e53e3e;
            }

            .breakdown-table {
                width: 100%;
                border-collapse: collapse;
            }

            .breakdown-table th {
                text-align: right;
                padding: 12px 10px;
                color: #718096;
                font-weight: 600;
                border-bottom: 2px solid #e2e8f0;
                font-size: 0.85rem;
            }

            .breakdown-table td {
                padding: 12px 10px;
                border-bottom: 1px solid #eee;
                font-size: 0.9rem;
            }

            .breakdown-table tr:last-child td {
                border-bottom: none;
            }

            .amount-cell {
                text-align: left;
                font-weight: 600;
            }

            .earning-amount {
                color: #38a169;
            }

            .deduction-amount {
                color: #e53e3e;
            }

            .total-row {
                background: white;
                font-weight: 700;
                border-top: 2px solid #e2e8f0;
            }

            .net-salary-box {
                background: linear-gradient(135deg, #f0fff4, #c6f6d5);
                border: 2px solid #38a169;
                border-radius: 12px;
                padding: 30px;
                text-align: center;
                margin: 30px 0;
            }

            .net-label {
                font-size: 1.2rem;
                color: #2d3748;
                margin-bottom: 10px;
            }

            .net-amount {
                font-size: 3rem;
                font-weight: 800;
                color: #38a169;
                margin: 10px 0;
            }

            .payment-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 25px;
                padding: 30px 40px;
                background: #f7fafc;
                border-top: 2px solid #e2e8f0;
            }

            .signature-section {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 30px;
                padding: 40px;
            }

            .signature-box {
                text-align: center;
                padding: 20px;
            }

            .signature-line {
                width: 80%;
                height: 1px;
                background: #000;
                margin: 50px auto 15px;
            }

            .signature-label {
                color: #2d3748;
                font-weight: 600;
                margin-top: 10px;
                font-size: 0.9rem;
            }

            .footer {
                padding: 25px 40px;
                background: #1a365d;
                color: white;
                text-align: center;
                font-size: 0.85rem;
            }

            .footer p {
                margin-bottom: 5px;
                opacity: 0.9;
            }

            @media print {
                body { background: white; padding: 0; }
                .payslip-wrapper { background: white; padding: 0; }
                .action-bar { display: none !important; }
                .payslip-container { box-shadow: none; border-radius: 0; }
            }

            @media (max-width: 768px) {
                .payslip-wrapper { padding: 15px; }
                .payslip-header, .info-section, .salary-section, .payment-details {
                    padding: 20px;
                }
                .breakdown-grid {
                    grid-template-columns: 1fr;
                }
                .net-amount {
                    font-size: 2rem;
                }
                .action-bar {
                    flex-direction: column;
                }
            }
        `}</style>

        <div className="payslip-wrapper">
            <div className="action-bar">
                <button className="btn-back" onClick={() => router.back()}>
                    <ArrowLeft size={18} /> العودة
                </button>
                <button className="btn-print" onClick={handlePrint}>
                    <Printer size={18} /> طباعة الإشعار
                </button>
            </div>

            <div className="payslip-container">
                {/* HEADER */}
                <div className="payslip-header">
                    <div className="header-pattern"></div>
                    <div className="header-content">
                        <div className="institution-info">
                            <h1>{settings.schoolName}</h1>
                            <p>Al Mawed Educational Institution</p>
                        </div>
                        <div className="payslip-title">
                            <h2>كشف الراتب</h2>
                            <p>Payslip</p>
                            <p style={{marginTop: '8px', fontSize: '0.95rem'}}>
                                {payroll.period}
                            </p>
                        </div>
                    </div>
                </div>

                {/* EMPLOYEE INFO */}
                <div className="info-section">
                    <div className="info-card">
                        <h3>معلومات الموظف</h3>
                        <div className="info-row">
                            <span className="info-label">الاسم الكامل</span>
                            <span className="info-value">{staff.name}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">معرف الموظف</span>
                            <span className="info-value">{formatStaffId(staff.id, staff.role)}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">القسم</span>
                            <span className="info-value">{staff.department || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">الدور</span>
                            <span className="info-value">{staff.role}</span>
                        </div>
                    </div>

                    <div className="info-card">
                        <h3>معلومات الدفع</h3>
                        <div className="info-row">
                            <span className="info-label">فترة الدفع</span>
                            <span className="info-value">{payroll.period}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">تاريخ التشغيل</span>
                            <span className="info-value">{format(new Date(payroll.runDate), "PPP")}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">طريقة الدفع</span>
                            <span className="info-value">تحويل بنكي</span>
                        </div>
                    </div>
                </div>

                {/* SALARY BREAKDOWN */}
                <div className="salary-section">
                    <h2 className="section-title">تفصيل الراتب</h2>

                    <div className="breakdown-grid">
                        {/* EARNINGS */}
                        <div className="breakdown-box earnings">
                            <h4>المداخيل</h4>
                            <table className="breakdown-table">
                                <thead>
                                    <tr>
                                        <th width="60%">البند</th>
                                        <th width="40%">المبلغ (درهم)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payslip.earnings && payslip.earnings.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.label}</td>
                                            <td className="amount-cell earning-amount">{formatCurrency(item.amount)}</td>
                                        </tr>
                                    ))}
                                    <tr className="total-row">
                                        <td>إجمالي المداخيل</td>
                                        <td className="amount-cell earning-amount">{formatCurrency(payslip.grossSalary || 0)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* DEDUCTIONS */}
                        <div className="breakdown-box deductions">
                            <h4>الاستقطاعات</h4>
                            <table className="breakdown-table">
                                <thead>
                                    <tr>
                                        <th width="60%">البند</th>
                                        <th width="40%">المبلغ (درهم)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payslip.deductions && payslip.deductions.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.label}</td>
                                            <td className="amount-cell deduction-amount">- {formatCurrency(item.amount)}</td>
                                        </tr>
                                    ))}
                                    <tr className="total-row">
                                        <td>إجمالي الاستقطاعات</td>
                                        <td className="amount-cell deduction-amount">- {formatCurrency(payslip.totalDeductions || 0)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* NET SALARY */}
                    <div className="net-salary-box">
                        <div className="net-label">صافي الراتب المستحق</div>
                        <div className="net-amount">{formatCurrency(payslip.netPay)}</div>
                        <p style={{marginTop: '10px', color: '#38a169', fontSize: '0.95rem'}}>
                            الراتب جاهز للتحويل البنكي
                        </p>
                    </div>
                </div>

                {/* PAYMENT DETAILS */}
                <div className="payment-details">
                    <div className="info-card">
                        <h3>معلومات البنك</h3>
                        <div className="info-row">
                            <span className="info-label">طريقة الدفع</span>
                            <span className="info-value">تحويل بنكي</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">حالة الدفع</span>
                            <span className="info-value" style={{color: '#38a169'}}>معلق</span>
                        </div>
                    </div>

                    <div className="info-card">
                        <h3>ملاحظات إضافية</h3>
                        <div className="info-row">
                            <span className="info-label">أيام العمل</span>
                            <span className="info-value">{daysWorked} يوم</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">أيام الغياب</span>
                            <span className="info-value">0 أيام</span>
                        </div>
                    </div>
                </div>

                {/* SIGNATURES */}
                <div className="signature-section">
                    <div className="signature-box">
                        <div className="signature-line"></div>
                        <div className="signature-label">توقيع الموظف</div>
                        <div style={{marginTop: '5px', color: '#666', fontSize: '0.85rem'}}>{staff.name}</div>
                    </div>
                    <div className="signature-box">
                        <div className="signature-line"></div>
                        <div className="signature-label">توقيع مدير الموارد البشرية</div>
                        <div style={{marginTop: '5px', color: '#666', fontSize: '0.85rem'}}>قسم الموارد البشرية</div>
                    </div>
                    <div className="signature-box">
                        <div className="signature-line"></div>
                        <div className="signature-label">ختم المؤسسة</div>
                        <div style={{marginTop: '15px', fontSize: '2rem', color: '#ccc', opacity: 0.3}}>⭕</div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="footer">
                    <p>هذا المستند رسمي ويحتوي على معلومات سرية</p>
                    <p>لأية استفسارات، يرجى الاتصال بقسم الموارد البشرية</p>
                    <p style={{marginTop: '10px', opacity: 0.7}}>
                        تم الإنشاء آلياً في {format(new Date(payroll.runDate), "PPP")}
                    </p>
                </div>
            </div>
        </div>
        </>
    );
}
