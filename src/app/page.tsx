'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Calendar, Users, Edit3, Trash2, CheckCircle2, Clock, Building2, X, Sparkles, Smile, DollarSign } from 'lucide-react'

interface Student {
  id: string
  name: string
  school: string
  grade: string
  parent_name: string
  parent_phone: string
  status: string
  notes: string
}

interface Revenue {
  id: string
  category: '원비' | '대관료'
  student_id?: string
  amount: number
  paid_date: string
  billing_month: string
  headcount?: number
  renter_name?: string
  notes?: string
}

interface Attendance {
  id: string
  student_id: string
  attendance_date: string
  status: '출석' | '결석' | '지각'
}

export default function Home() {
  const [tab, setTab] = useState<'attendance' | 'tuition' | 'rentals' | 'students'>('attendance')
  const [students, setStudents] = useState<Student[]>([])
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [search, setSearch] = useState('')

  const todayStr = '2026-10-13'
  const currentMonthStr = '2026-10'
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr)

  const [studentModal, setStudentModal] = useState<Student | null | 'new'>(null)
  const [tuitionModal, setTuitionModal] = useState<{ student: Student; rev?: Revenue } | null>(null)
  const [rentalModal, setRentalModal] = useState<Revenue | null | 'new'>(null)

  const [sForm, setSForm] = useState({ name: '', school: '', grade: '', parent_name: '', parent_phone: '', status: '재원', notes: '' })
  const [tForm, setTForm] = useState({ amount: '250000', paid_date: todayStr, billing_month: currentMonthStr, notes: '' })
  const [rForm, setRForm] = useState({ renter_name: '', amount: '150000', headcount: '1', paid_date: todayStr, billing_month: currentMonthStr, notes: '' })

  const loadData = async () => {
    const { data: s } = await supabase.from('students').select('*').order('created_at', { ascending: false })
    const { data: r } = await supabase.from('revenues').select('*').order('paid_date', { ascending: false })
    const { data: a } = await supabase.from('attendances').select('*')
    if (s) setStudents(s)
    if (r) setRevenues(r)
    if (a) setAttendances(a)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAttendance = async (studentId: string, status: '출석' | '결석' | '지각') => {
    const exist = attendances.find((a) => a.student_id === studentId && a.attendance_date === selectedDate)
    if (exist) {
      if (exist.status === status) {
        await supabase.from('attendances').delete().eq('id', exist.id)
      } else {
        await supabase.from('attendances').update({ status }).eq('id', exist.id)
      }
    } else {
      await supabase.from('attendances').insert([{ student_id: studentId, attendance_date: selectedDate, status }])
    }
    loadData()
  }

  const saveStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sForm.name || !sForm.parent_phone) return alert('이름과 연락처를 입력해 주세요!')
    if (studentModal && studentModal !== 'new') {
      await supabase.from('students').update(sForm).eq('id', studentModal.id)
    } else {
      await supabase.from('students').insert([sForm])
    }
    setStudentModal(null)
    loadData()
  }

  const deleteStudent = async (id: string, name: string) => {
    if (!confirm(`'${name}' 학생 정보를 삭제할까요?`)) return
    await supabase.from('students').delete().eq('id', id)
    loadData()
  }

  const saveTuition = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tuitionModal) return
    const payload = {
      category: '원비',
      student_id: tuitionModal.student.id,
      amount: parseInt(tForm.amount, 10),
      paid_date: tForm.paid_date,
      billing_month: tForm.billing_month,
      notes: tForm.notes,
    }
    if (tuitionModal.rev) {
      await supabase.from('revenues').update(payload).eq('id', tuitionModal.rev.id)
    } else {
      await supabase.from('revenues').insert([payload])
    }
    setTuitionModal(null)
    loadData()
  }

  const saveRental = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      category: '대관료',
      renter_name: rForm.renter_name,
      amount: parseInt(rForm.amount, 10),
      headcount: parseInt(rForm.headcount, 10),
      paid_date: rForm.paid_date,
      billing_month: rForm.billing_month,
      notes: rForm.notes,
    }
    if (rentalModal && rentalModal !== 'new') {
      await supabase.from('revenues').update(payload).eq('id', rentalModal.id)
    } else {
      await supabase.from('revenues').insert([payload])
    }
    setRentalModal(null)
    loadData()
  }

  const deleteRevenue = async (id: string) => {
    if (!confirm('이 내역을 삭제할까요?')) return
    await supabase.from('revenues').delete().eq('id', id)
    loadData()
  }

  const enrolled = students.filter((s) => s.status === '재원')
  const monthlyRev = revenues.filter((r) => (r.billing_month || r.paid_date.slice(0, 7)) === selectedMonth)
  const monthlyTuitions = monthlyRev.filter((r) => r.category === '원비')
  const monthlyRentals = monthlyRev.filter((r) => r.category === '대관료')
  const tuitionTotal = monthlyTuitions.reduce((a, c) => a + c.amount, 0)
  const rentalTotal = monthlyRentals.reduce((a, c) => a + c.amount, 0)
  const paidSet = new Set(monthlyTuitions.map((t) => t.student_id))

  const dayAtt = attendances.filter((a) => a.attendance_date === selectedDate)
  const presentCount = dayAtt.filter((a) => a.status === '출석').length
  const absentCount = dayAtt.filter((a) => a.status === '결석').length
  const lateCount = dayAtt.filter((a) => a.status === '지각').length

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#4A443F] font-sans pb-16">
      {/* 귀여운 상단 네비게이션 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#F0EBE1] sticky top-0 z-20 px-5 py-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg font-bold shadow-inner">
              🌱
            </span>
            <div>
              <h1 className="text-base font-extrabold text-[#38332E] tracking-tight">우리학원 다이어리</h1>
              <p className="text-[11px] text-[#8C827A] font-medium">원생 · 출석 · 원비 · 대관 관리</p>
            </div>
          </div>

          {/* 둥글둥글 탭 메뉴 */}
          <div className="flex bg-[#F5F1E9] p-1 rounded-2xl gap-1 text-xs font-semibold">
            <button
              onClick={() => setTab('attendance')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                tab === 'attendance' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-[#7D736A] hover:text-[#4A443F]'
              }`}
            >
              🌿 출석체크
            </button>
            <button
              onClick={() => setTab('tuition')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                tab === 'tuition' ? 'bg-white text-amber-700 shadow-sm font-bold' : 'text-[#7D736A] hover:text-[#4A443F]'
              }`}
            >
              💰 원비장부
            </button>
            <button
              onClick={() => setTab('rentals')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                tab === 'rentals' ? 'bg-white text-violet-700 shadow-sm font-bold' : 'text-[#7D736A] hover:text-[#4A443F]'
              }`}
            >
              🏠 공간대관
            </button>
            <button
              onClick={() => setTab('students')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                tab === 'students' ? 'bg-white text-[#38332E] shadow-sm font-bold' : 'text-[#7D736A] hover:text-[#4A443F]'
              }`}
            >
              🐣 학생들({students.length})
            </button>
          </div>
        </div>
      </header>

      {/* 포근한 통계 요약 카드 */}
      <section className="max-w-5xl mx-auto px-4 mt-5">
        {tab === 'attendance' ? (
          <div className="grid grid-cols-4 gap-2.5">
            <div className="bg-emerald-50/70 border border-emerald-100/80 p-3 rounded-2xl text-center shadow-sm">
              <span className="text-[11px] font-bold text-emerald-600">출석</span>
              <p className="text-lg font-black text-emerald-900 mt-0.5">{presentCount}<span className="text-xs font-normal">명</span></p>
            </div>
            <div className="bg-rose-50/70 border border-rose-100/80 p-3 rounded-2xl text-center shadow-sm">
              <span className="text-[11px] font-bold text-rose-600">결석</span>
              <p className="text-lg font-black text-rose-900 mt-0.5">{absentCount}<span className="text-xs font-normal">명</span></p>
            </div>
            <div className="bg-amber-50/70 border border-amber-100/80 p-3 rounded-2xl text-center shadow-sm">
              <span className="text-[11px] font-bold text-amber-600">지각</span>
              <p className="text-lg font-black text-amber-900 mt-0.5">{lateCount}<span className="text-xs font-normal">명</span></p>
            </div>
            <div className="bg-[#F5F1E9] border border-[#EAE3D6] p-3 rounded-2xl text-center shadow-sm">
              <span className="text-[11px] font-bold text-[#82776E]">총 재원</span>
              <p className="text-lg font-black text-[#423C36] mt-0.5">{enrolled.length}<span className="text-xs font-normal">명</span></p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2.5">
            <div className="bg-amber-50/70 border border-amber-100/80 p-3 rounded-2xl text-center shadow-sm">
              <span className="text-[11px] font-bold text-amber-700">원비 수납</span>
              <p className="text-base font-black text-amber-950 mt-0.5">{tuitionTotal.toLocaleString()}<span className="text-[10px] font-normal">원</span></p>
            </div>
            <div className="bg-violet-50/70 border border-violet-100/80 p-3 rounded-2xl text-center shadow-sm">
              <span className="text-[11px] font-bold text-violet-700">대관 수익</span>
              <p className="text-base font-black text-violet-950 mt-0.5">{rentalTotal.toLocaleString()}<span className="text-[10px] font-normal">원</span></p>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-100/80 p-3 rounded-2xl text-center shadow-sm">
              <span className="text-[11px] font-bold text-emerald-600">완납</span>
              <p className="text-base font-black text-emerald-900 mt-0.5">{paidSet.size}<span className="text-[10px] font-normal">명</span></p>
            </div>
            <div className="bg-rose-50/70 border border-rose-100/80 p-3 rounded-2xl text-center shadow-sm">
              <span className="text-[11px] font-bold text-rose-600">미납</span>
              <p className="text-base font-black text-rose-900 mt-0.5">{Math.max(0, enrolled.length - paidSet.size)}<span className="text-[10px] font-normal">명</span></p>
            </div>
          </div>
        )}
      </section>

      {/* 메인 내용 영역 */}
      <main className="max-w-5xl mx-auto px-4 mt-5">
        {/* 1. 출석체크 탭 */}
        {tab === 'attendance' && (
          <div>
            <div className="flex items-center justify-between mb-3 bg-white p-3 rounded-2xl border border-[#F0EBE1] shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#6B6158]">📅 출석 날짜</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl px-2.5 py-1 text-xs font-bold text-[#423C36] outline-none"
                />
              </div>
              <span className="text-[11px] text-[#A3998F]">누르면 바로 저장돼요! ✨</span>
            </div>

            <div className="space-y-2.5">
              {enrolled.map((st) => {
                const status = dayAtt.find((a) => a.student_id === st.id)?.status
                return (
                  <div
                    key={st.id}
                    className="bg-white p-4 rounded-2xl border border-[#F0EBE1] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between hover:border-amber-200 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#38332E] text-base">{st.name}</span>
                        <span className="text-[11px] bg-[#F5F1E9] text-[#7D736A] px-2 py-0.5 rounded-full font-medium">
                          {st.school || '학교미입력'} {st.grade && `· ${st.grade}`}
                        </span>
                      </div>
                      <p className="text-xs text-[#998E84] mt-1">📞 {st.parent_phone}</p>
                    </div>

                    <div className="flex gap-1.5 bg-[#FAF8F5] p-1 rounded-2xl border border-[#F0EBE1]">
                      <button
                        onClick={() => handleAttendance(st.id, '출석')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          status === '출석'
                            ? 'bg-emerald-500 text-white shadow-sm scale-105'
                            : 'text-[#8C827A] hover:bg-white'
                        }`}
                      >
                        🌱 출석
                      </button>
                      <button
                        onClick={() => handleAttendance(st.id, '지각')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          status === '지각'
                            ? 'bg-amber-400 text-amber-950 shadow-sm scale-105'
                            : 'text-[#8C827A] hover:bg-white'
                        }`}
                      >
                        ⏰ 지각
                      </button>
                      <button
                        onClick={() => handleAttendance(st.id, '결석')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          status === '결석'
                            ? 'bg-rose-400 text-white shadow-sm scale-105'
                            : 'text-[#8C827A] hover:bg-white'
                        }`}
                      >
                        💤 결석
                      </button>
                    </div>
                  </div>
                )
              })}
              {enrolled.length === 0 && (
                <div className="text-center py-12 bg-white rounded-3xl border border-[#F0EBE1] text-xs text-[#A89F95]">
                  아직 등록된 학생이 없어요 🐣
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. 월별 원비 탭 */}
        {tab === 'tuition' && (
          <div>
            <div className="flex items-center justify-between mb-3 bg-white p-3 rounded-2xl border border-[#F0EBE1] shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#6B6158]">🗓 청구월</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl px-2.5 py-1 text-xs font-bold text-[#423C36] outline-none"
                />
              </div>
              <span className="text-[11px] text-[#A3998F]">입금일자 버튼을 눌러 수정할 수 있어요</span>
            </div>

            <div className="space-y-2.5">
              {enrolled.map((st) => {
                const rev = monthlyTuitions.find((t) => t.student_id === st.id)
                return (
                  <div
                    key={st.id}
                    className="bg-white p-4 rounded-2xl border border-[#F0EBE1] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#38332E] text-base">{st.name}</span>
                        {rev ? (
                          <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full font-bold">
                            완납 ✨
                          </span>
                        ) : (
                          <span className="text-[11px] bg-rose-50 text-rose-600 border border-rose-200/80 px-2 py-0.5 rounded-full font-bold">
                            미납 ⏳
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#998E84] mt-1">
                        금액: <b className="text-[#38332E]">{rev ? `${rev.amount.toLocaleString()}원` : '미입금'}</b>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {rev ? (
                        <>
                          <button
                            onClick={() => {
                              setTForm({ amount: String(rev.amount), paid_date: rev.paid_date, billing_month: rev.billing_month || selectedMonth, notes: rev.notes || '' })
                              setTuitionModal({ student: st, rev })
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100/70 border border-amber-200/60 rounded-xl text-xs font-bold text-amber-800 transition"
                          >
                            📅 {rev.paid_date} <Edit3 size={11} />
                          </button>
                          <button
                            onClick={() => deleteRevenue(rev.id)}
                            className="text-[11px] text-[#A89F95] hover:text-rose-600 px-2 py-1"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setTForm({ amount: '250000', paid_date: selectedDate, billing_month: selectedMonth, notes: '' })
                            setTuitionModal({ student: st })
                          }}
                          className="px-3.5 py-1.5 bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-xl text-xs font-bold shadow-sm transition"
                        >
                          입금 확인하기
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 3. 대관료 탭 */}
        {tab === 'rentals' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-[#6B6158]">✨ {selectedMonth} 대관 이용 명세</span>
              <button
                onClick={() => {
                  setRForm({ renter_name: '', amount: '150000', headcount: '1', paid_date: selectedDate, billing_month: selectedMonth, notes: '' })
                  setRentalModal('new')
                }}
                className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <Plus size={14} /> 새 대관 등록
              </button>
            </div>

            <div className="space-y-2.5">
              {monthlyRentals.map((r) => (
                <div
                  key={r.id}
                  className="bg-white p-4 rounded-2xl border border-[#F0EBE1] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#38332E] text-base">🏠 {r.renter_name || '이름 없음'}</span>
                      <span className="text-[11px] bg-violet-50 text-violet-700 border border-violet-200/80 px-2 py-0.5 rounded-full font-bold">
                        {r.headcount || 1}명 이용
                      </span>
                    </div>
                    <p className="text-xs text-[#998E84] mt-1 font-medium">
                      대관료: <b className="text-violet-900">{r.amount.toLocaleString()}원</b> {r.notes && `· ${r.notes}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setRForm({ renter_name: r.renter_name || '', amount: String(r.amount), headcount: String(r.headcount || 1), paid_date: r.paid_date, billing_month: r.billing_month || selectedMonth, notes: r.notes || '' })
                        setRentalModal(r)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#EAE3D6] rounded-xl text-xs font-bold text-[#574E45] transition"
                    >
                      📅 {r.paid_date} <Edit3 size={11} className="text-violet-600" />
                    </button>
                    <button
                      onClick={() => deleteRevenue(r.id)}
                      className="p-1.5 text-[#B8ADA2] hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {monthlyRentals.length === 0 && (
                <div className="text-center py-12 bg-white rounded-3xl border border-[#F0EBE1] text-xs text-[#A89F95]">
                  등록된 대관 내역이 없어요 🎈
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. 학생 명단 탭 */}
        {tab === 'students' && (
          <div>
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-2.5 text-[#A3998F]" />
                <input
                  type="text"
                  placeholder="이름이나 연락처로 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-[#EAE3D6] rounded-2xl pl-8 pr-3 py-1.5 text-xs outline-none shadow-sm placeholder:text-[#BBB0A4]"
                />
              </div>
              <button
                onClick={() => {
                  setSForm({ name: '', school: '', grade: '', parent_name: '', parent_phone: '', status: '재원', notes: '' })
                  setStudentModal('new')
                }}
                className="bg-[#4A7C59] hover:bg-[#3D6649] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <Plus size={14} /> 원생 추가
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {students
                .filter((s) => s.name.includes(search) || s.parent_phone.includes(search))
                .map((st) => (
                  <div
                    key={st.id}
                    className="bg-white p-4 rounded-2xl border border-[#F0EBE1] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#38332E] text-base">{st.name}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              st.status === '재원' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {st.status}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setSForm({ name: st.name, school: st.school || '', grade: st.grade || '', parent_name: st.parent_name || '', parent_phone: st.parent_phone, status: st.status, notes: st.notes || '' })
                              setStudentModal(st)
                            }}
                            className="p-1.5 text-[#B8ADA2] hover:text-[#4A7C59]"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button onClick={() => deleteStudent(st.id, st.name)} className="p-1.5 text-[#B8ADA2] hover:text-rose-500">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-[#7D736A] space-y-1">
                        <p>🏫 {st.school || '학교 미기재'} {st.grade && `(${st.grade})`}</p>
                        <p>📞 {st.parent_phone} {st.parent_name && `(${st.parent_name})`}</p>
                      </div>
                    </div>
                    {st.notes && (
                      <div className="mt-3 pt-2 border-t border-[#F7F3EC] text-[11px] text-[#A3998F] truncate">
                        📝 {st.notes}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* 모달: 학생 추가/수정 */}
      {studentModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative border border-[#F0EBE1]">
            <button onClick={() => setStudentModal(null)} className="absolute right-4 top-4 text-[#A89F95] hover:text-[#4A443F]">
              <X size={18} />
            </button>
            <h3 className="font-extrabold text-base mb-4 text-[#38332E]">
              {studentModal === 'new' ? '🐣 새 원생 맞이하기' : '✏️ 원생 정보 수정'}
            </h3>
            <form onSubmit={saveStudent} className="space-y-3 text-xs font-medium">
              <input required placeholder="학생 이름" value={sForm.name} onChange={(e) => setSForm({ ...sForm, name: e.target.value })} className="w-full bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl p-2.5 outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="학교 (예: 서울중)" value={sForm.school} onChange={(e) => setSForm({ ...sForm, school: e.target.value })} className="bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl p-2.5 outline-none" />
                <input placeholder="학년" value={sForm.grade} onChange={(e) => setSForm({ ...sForm, grade: e.target.value })} className="bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl p-2.5 outline-none" />
              </div>
              <input required placeholder="보호자 연락처 (010-0000-0000)" value={sForm.parent_phone} onChange={(e) => setSForm({ ...sForm, parent_phone: e.target.value })} className="w-full bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl p-2.5 outline-none" />
              <select value={sForm.status} onChange={(e) => setSForm({ ...sForm, status: e.target.value })} className="w-full bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl p-2.5 outline-none font-bold text-[#4A443F]">
                <option value="재원">재원</option>
                <option value="휴원">휴원</option>
                <option value="퇴원">퇴원</option>
              </select>
              <textarea placeholder="특이사항 / 메모" rows={2} value={sForm.notes} onChange={(e) => setSForm({ ...sForm, notes: e.target.value })} className="w-full bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl p-2.5 outline-none resize-none" />
              <button type="submit" className="w-full bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-xl py-2.5 font-bold shadow-md transition">
                저장 완료
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 모달: 원비 입금일자 수정 */}
      {tuitionModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative border border-[#F0EBE1]">
            <button onClick={() => setTuitionModal(null)} className="absolute right-4 top-4 text-[#A89F95] hover:text-[#4A443F]">
              <X size={18} />
            </button>
            <h3 className="font-extrabold text-base mb-4 text-[#38332E]">💰 원비 입금 다이어리</h3>
            <form onSubmit={saveTuition} className="space-y-3 text-xs font-medium">
              <div className="p-3 bg-[#FAF8F5] rounded-xl font-bold text-sm text-[#38332E] border border-[#EAE3D6]">
                학생: {tuitionModal.student.name}
              </div>
              <div>
                <label className="text-[11px] text-[#8C827A] mb-1 block">청구월</label>
                <input required type="month" value={tForm.billing_month} onChange={(e) => setTForm({ ...tForm, billing_month: e.target.value })} className="w-full bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl p-2.5 outline-none" />
              </div>
              <div>
                <label className="text-[11px] text-[#8C827A] mb-1 block">입금 금액 (원)</label>
                <input required type="number" value={tForm.amount} onChange={(e) => setTForm({ ...tForm, amount: e.target.value })} className="w-full bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl p-2.5 outline-none font-bold" />
              </div>
              <div>
                <label className="text-[11px] text-[#8C827A] mb-1 block">입금 일자</label>
                <input required type="date" value={tForm.paid_date} onChange={(e) => setTForm({ ...tForm, paid_date: e.target.value })} className="w-full bg-amber-50 border border-amber-200 rounded-xl p-2.5 outline-none font-bold text-amber-900" />
              </div>
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-2.5 font-bold shadow-md transition">
                수납 저장하기
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 모달: 대관 등록/수정 */}
      {rentalModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative border border-[#F0EBE1]">
            <button onClick={() => setRentalModal(null)} className="absolute right-4 top-4 text-[#A89F95] hover:text-[#4A443F]">
              <X size={18} />
            </button>
            <h3 className="font-extrabold text-base mb-4 text-[#38332E]">🏠 대관 내역 적기</h3>
            <form onSubmit={saveRental} className="space-y-3 text-xs font-medium">
              <input required placeholder="대관자 또는 모임명" value={rForm.renter_name} onChange={(e) => setRForm({ ...rForm, renter_name: e.target.value })} className="w-full bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl p-2.5 outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-[#8C827A] mb-1 block">금액</label>
                  <input required type="number" placeholder="대관료" value={rForm.amount} onChange={(e) => setRForm({ ...rForm, amount: e.target.value })} className="w-full bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl p-2.5 outline-none" />
                </div>
                <div>
                  <label className="text-[11px] text-[#8C827A] mb-1 block">이용 인원 (명)</label>
                  <input required type="number" min="1" value={rForm.headcount} onChange={(e) => setRForm({ ...rForm, headcount: e.target.value })} className="w-full bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl p-2.5 outline-none font-bold text-violet-700" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#8C827A] mb-1 block">입금/이용 일자</label>
                <input required type="date" value={rForm.paid_date} onChange={(e) => setRForm({ ...rForm, paid_date: e.target.value })} className="w-full bg-violet-50 border border-violet-200 rounded-xl p-2.5 outline-none font-bold text-violet-900" />
              </div>
              <textarea placeholder="메모" rows={2} value={rForm.notes} onChange={(e) => setRForm({ ...rForm, notes: e.target.value })} className="w-full bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl p-2.5 outline-none resize-none" />
              <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 font-bold shadow-md transition">
                저장하기
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}