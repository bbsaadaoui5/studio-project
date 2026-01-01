import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/i18n/translation-provider';

const sections = [
	{ id: 'teacherPortal', icon: '🧑‍🏫', key: 'sidebar.teacherPortal' },
];

// Demo data for teacher portal selector
const demoGrades = [
	{ id: 1, name: 'الأولى إعدادي' },
	{ id: 2, name: 'الثانية إعدادي' },
	{ id: 3, name: 'الثالثة إعدادي' },
];
const demoStudents: { [gradeId: string]: { id: number; name: string }[] } = {
	'1': [{ id: 1, name: 'محمد علي' }, { id: 2, name: 'سارة أحمد' }],
	'2': [{ id: 3, name: 'يوسف سعيد' }, { id: 4, name: 'ليلى سمير' }],
	'3': [{ id: 5, name: 'آدم كريم' }, { id: 6, name: 'مريم فؤاد' }],
};

type TeacherDashboardProps = {
	teacherId?: string;
};

export default function TeacherDashboard({ teacherId }: TeacherDashboardProps) {
	const TEACHER_PORTAL_ENABLED = process.env.NEXT_PUBLIC_TEACHER_PORTAL_ENABLED === 'true';
	const [selectedGrade, setSelectedGrade] = useState<string>('');
	const [selectedStudent, setSelectedStudent] = useState<string>('');
	const [showTeacherPortal, setShowTeacherPortal] = useState(false);

	const { t } = useTranslation();

	const handleViewPortal = (studentId?: string) => {
		const id = studentId ?? selectedStudent;
		if (!TEACHER_PORTAL_ENABLED) {
			// silently ignore or notify
			alert('بوابة الأساتذة معطلة مؤقتاً.');
			return;
		}
		if (!id) return;
		window.open(`/teacher/portal/${id}`, '_blank');
	};

	function TeacherPortalSelector() {
		return (
			<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
				<div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-right relative">
					<button
						type="button"
						className="absolute left-4 top-4 text-gray-400 hover:text-gray-600 text-2xl"
						onClick={() => setShowTeacherPortal(false)}
						aria-label="إغلاق"
					>
						×
					</button>
					<h2 className="text-xl font-bold mb-2">عرض بوابة الأستاذ</h2>
					<p className="mb-4 text-gray-500">اختر الصف ثم الطالب لعرض بوابة الأستاذ الخاصة به.</p>

					<div className="mb-4">
						<label className="block mb-1">الصف</label>
						<select
							className="border rounded px-2 py-1 w-full"
							value={selectedGrade}
							onChange={(e) => {
								setSelectedGrade(e.target.value);
								setSelectedStudent('');
							}}
						>
							<option value="">اختر الصف...</option>
							{demoGrades.map((grade) => (
								<option key={grade.id} value={String(grade.id)}>
									{grade.name}
								</option>
							))}
						</select>
					</div>

					<div className="mb-4">
						<label className="block mb-1">الطالب</label>
						<select
							className="border rounded px-2 py-1 w-full"
							value={selectedStudent}
							onChange={(e) => setSelectedStudent(e.target.value)}
							disabled={!selectedGrade}
						>
							<option value="">{selectedGrade ? 'اختر الطالب...' : 'اختر الصف أولاً'}</option>
							{selectedGrade && demoStudents[selectedGrade]?.map((student) => (
								<option key={student.id} value={String(student.id)}>
									{student.name}
								</option>
							))}
						</select>
					</div>

					<button
						type="button"
						className="bg-blue-600 text-white rounded px-4 py-2 w-full disabled:opacity-50"
						disabled={!selectedGrade || !selectedStudent}
						onClick={() => handleViewPortal()}
					>
						عرض البوابة
					</button>
				</div>
			</div>
		);
	}

	const sectionTitle = t('sidebar.teacherPortal');

	return (
		<div className="min-h-screen bg-gray-50 p-6">
			<div className="max-w-3xl mx-auto">
				<Card>
					<CardHeader>
						<CardTitle>
							{sections[0].icon} {sectionTitle}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<button
							type="button"
							className="bg-blue-600 text-white rounded px-4 py-2 mb-4"
							onClick={() => setShowTeacherPortal(true)}
							aria-label="فتح أداة عرض بوابة الأستاذ"
							disabled={!TEACHER_PORTAL_ENABLED}
						>
							{TEACHER_PORTAL_ENABLED ? 'عرض بوابة الأستاذ' : 'البوابة معطلة'}
						</button>
						{showTeacherPortal && <TeacherPortalSelector />}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

// single default export already declared above