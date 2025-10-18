"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/translation-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Plus, 
  Trash2, 
  Download, 
  Eye,
  Settings,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp
} from "lucide-react";

interface ReportField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  required: boolean;
}

interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: string;
  value2?: string;
}

interface ReportConfig {
  name: string;
  description: string;
  fields: ReportField[];
  filters: ReportFilter[];
  chartType: 'bar' | 'line' | 'pie' | 'table';
  groupBy?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function CustomReportBuilder() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<ReportConfig>({
    name: "",
    description: "",
    fields: [],
    filters: [],
    chartType: 'bar',
    sortBy: '',
    sortOrder: 'desc'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<Array<Record<string, unknown>>>([]);
  const [showPreview, setShowPreview] = useState(false);

  type AvailableField = { id: string; name: string; type: ReportField['type']; options?: string[] };
  const availableFields: AvailableField[] = [
    { id: 'student_name', name: 'اسم الطالب', type: 'text' },
    { id: 'grade', name: 'المستوى', type: 'select', options: ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة', 'الحادية عشر', 'الثانية عشر'] },
    { id: 'class_name', name: 'القسم', type: 'select', options: ['أ', 'ب', 'ج', 'د'] },
    { id: 'average_grade', name: 'متوسط المعدل', type: 'number' },
    { id: 'attendance_rate', name: 'نسبة الحضور', type: 'number' },
    { id: 'enrollment_date', name: 'تاريخ التسجيل', type: 'date' },
    { id: 'teacher_name', name: 'اسم المعلم', type: 'text' },
    { id: 'course_name', name: 'اسم المادة', type: 'text' },
    { id: 'pass_rate', name: 'نسبة النجاح', type: 'number' }
  ];

  const addField = () => {
    const newField: ReportField = {
      id: `field_${Date.now()}`,
      name: '',
      type: 'text',
      required: false
    };
    setConfig(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const updateField = (fieldId: string, updates: Partial<ReportField>) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    }));
  };

  const removeField = (fieldId: string) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId)
    }));
  };

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: `filter_${Date.now()}`,
      field: '',
      operator: 'equals',
      value: ''
    };
    setConfig(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter]
    }));
  };

  const updateFilter = (filterId: string, updates: Partial<ReportFilter>) => {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.map(f => f.id === filterId ? { ...f, ...updates } : f)
    }));
  };

  const removeFilter = (filterId: string) => {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.filter(f => f.id !== filterId)
    }));
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      // Mock data generation based on configuration
      const mockData = generateMockData();
      setReportData(mockData);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockData = (): Array<Record<string, unknown>> => {
    const data: Array<Record<string, unknown>> = [];
    const count = Math.floor(Math.random() * 50) + 20; // 20-70 records
    
    for (let i = 0; i < count; i++) {
      const record: Record<string, unknown> = {};
      
      config.fields.forEach(field => {
        switch (field.id) {
          case 'student_name':
            record[field.name] = `Student ${i + 1}`;
            break;
          case 'grade':
            record[field.name] = Math.floor(Math.random() * 12) + 1;
            break;
          case 'class_name':
            record[field.name] = ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];
            break;
          case 'average_grade':
            record[field.name] = Math.floor(Math.random() * 40) + 60;
            break;
          case 'attendance_rate':
            record[field.name] = Math.floor(Math.random() * 30) + 70;
            break;
          case 'enrollment_date':
            record[field.name] = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0];
            break;
          case 'teacher_name':
            record[field.name] = `Teacher ${Math.floor(Math.random() * 10) + 1}`;
            break;
          case 'course_name':
            record[field.name] = `Course ${Math.floor(Math.random() * 20) + 1}`;
            break;
          case 'pass_rate':
            record[field.name] = Math.floor(Math.random() * 40) + 60;
            break;
          default:
            record[field.name] = `Value ${i + 1}`;
        }
      });
      
      data.push(record);
    }
    
    return data;
  };

  const renderChart = () => {
    if (reportData.length === 0) return null;

    const chartData = reportData.slice(0, 10); // Limit to 10 items for readability
  const dataKey = config.fields[0]?.name || 'value';
  const nameKey = config.fields[1]?.name || 'name';

    switch (config.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={nameKey} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={dataKey} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={nameKey} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: Record<string, unknown>) => `${String(entry[nameKey])}: ${String(entry[dataKey])}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={dataKey}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <div className="space-y-2">
            {reportData.slice(0, 20).map((row: Record<string, unknown>, index) => (
              <div key={index} className="flex justify-between items-center p-2 border rounded">
                {Object.entries(row).map(([key, value]) => (
                  <span key={key} className="text-sm">{String(value)}</span>
                ))}
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Settings className="h-5 w-5" />
              {t('reports.reportConfiguration')}
            </CardTitle>
            <CardDescription className="text-right">{t('reports.configureParameters')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="report-name" className="text-right">{t('reports.reportName')}</Label>
              <Input
                id="report-name"
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('reports.enterReportName')}
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-description" className="text-right">{t('reports.reportDescription')}</Label>
              <Textarea
                id="report-description"
                value={config.description}
                onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('reports.enterReportDescription')}
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-right">{t('reports.chartType')}</Label>
              <Select value={config.chartType} onValueChange={(value: ReportConfig['chartType']) => setConfig(prev => ({ ...prev, chartType: value }))}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder={t('reports.selectChartType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      {t('reports.barChart')}
                    </div>
                  </SelectItem>
                  <SelectItem value="line">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {t('reports.lineChart')}
                    </div>
                  </SelectItem>
                  <SelectItem value="pie">
                    <div className="flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4" />
                      {t('reports.pieChart')}
                    </div>
                  </SelectItem>
                  <SelectItem value="table">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {t('reports.table')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                <Label className="text-right">{t('reports.fieldsToInclude')}</Label>
                <Button onClick={addField} size="sm" className="text-right" aria-label={t('reports.addField') || 'Add field'}>
                  <Plus className="h-4 w-4 ml-1" />
                  <span className="sr-only">{t('reports.addField') || 'Add field'}</span>
                  {t('reports.addField')}
                </Button>
              </div>
              <div className="space-y-2">
                {config.fields.map((field) => (
                  <div key={field.id} className="flex items-center gap-2 p-2 border rounded">
                    <Select
                      value={field.id}
                      onValueChange={(value) => {
                        const selectedField = availableFields.find(f => f.id === value);
                        if (selectedField) {
                                updateField(field.id, {
                                  id: selectedField.id,
                                  name: selectedField.name,
                                  type: selectedField.type,
                                  options: selectedField.options
                                });
                        }
                      }}
                    >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="اختر الحقل" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => removeField(field.id)}
                      variant="outline"
                      size="sm"
                      aria-label={t('reports.removeField') || 'Remove field'}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t('reports.removeField') || 'Remove field'}</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>الفلاتر</Label>
                <Button onClick={addFilter} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  إضافة فلتر
                </Button>
              </div>
              <div className="space-y-2">
                {config.filters.map((filter) => (
                  <div key={filter.id} className="flex items-center gap-2 p-2 border rounded">
                    <Select
                      value={filter.field}
                      onValueChange={(value) => updateFilter(filter.id, { field: value })}
                    >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="الحقل" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={filter.operator}
                      onValueChange={(value: ReportFilter['operator']) => updateFilter(filter.id, { operator: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">يساوي</SelectItem>
                        <SelectItem value="contains">يحتوي</SelectItem>
                        <SelectItem value="greater_than">أكبر من</SelectItem>
                        <SelectItem value="less_than">أقل من</SelectItem>
                        <SelectItem value="between">بين</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={filter.value}
                      onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                      placeholder="القيمة"
                      className="flex-1"
                    />
                    <Button
                      onClick={() => removeFilter(filter.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={generateReport} disabled={isGenerating || config.fields.length === 0}>
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    إنشاء التقرير
                  </>
                )}
              </Button>
              {showPreview && (
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  تصدير
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              معاينة التقرير
            </CardTitle>
            <CardDescription>معاينة التقرير المخصص</CardDescription>
          </CardHeader>
          <CardContent>
            {showPreview && reportData.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{config.name}</h3>
                  <Badge variant="outline">{reportData.length} سجل</Badge>
                </div>
                {config.description && (
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                )}
                <div className="border rounded p-4">
                  {renderChart()}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4" />
                <p>أنشئ تقريرًا لمشاهدة المعاينة</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
