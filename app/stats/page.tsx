'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Euro,
  Download,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'

const StatsPage = () => {
  interface MonthlyData {
    month: string
    income: number
    classes: number
    students: number
  }

  interface WeeklyData {
    day: string
    classes: number
    income: number
  }

  interface SubjectData {
    subject: string
    students: number
    income: number
  }

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalIncome: 0,
    monthlyData: [] as MonthlyData[],
    weeklyData: [] as WeeklyData[],
    subjectData: [] as SubjectData[]
  })
  const [isLoading, setIsLoading] = useState(true)

  // Fetch data from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        
        // Fetch students
        const studentsResponse = await fetch('/api/students')
        const studentsData = studentsResponse.ok ? await studentsResponse.json() : []
        
        // Fetch classes
        const classesResponse = await fetch('/api/classes')
        const classesData = classesResponse.ok ? await classesResponse.json() : []
        
        // Fetch courses
        const coursesResponse = await fetch('/api/courses')
        const coursesData = coursesResponse.ok ? await coursesResponse.json() : []
        
        // Calculate stats
        const totalStudents = studentsData.length
        const totalClasses = classesData.length
        const totalIncome = classesData.reduce((sum: number, cls: any) => sum + (cls.price || 0), 0)
        
        // Generate monthly data (last 6 months)
        const monthlyData = generateMonthlyData(classesData)
        
        // Generate weekly data
        const weeklyData = generateWeeklyData(classesData)
        
        // Generate subject data
        const subjectData = generateSubjectData(studentsData, coursesData, classesData)
        
        setStats({
          totalStudents,
          totalClasses,
          totalIncome,
          monthlyData,
          weeklyData,
          subjectData
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const generateMonthlyData = (classes: any[]): MonthlyData[] => {
    const months: MonthlyData[] = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleDateString('es-ES', { month: 'short' })
      
      const monthClasses = classes.filter((cls: any) => {
        const classDate = new Date(cls.date)
        return classDate.getMonth() === date.getMonth() && classDate.getFullYear() === date.getFullYear()
      })
      
      const income = monthClasses.reduce((sum: number, cls: any) => sum + (cls.price || 0), 0)
      
      months.push({
        month: monthKey,
        income,
        classes: monthClasses.length,
        students: new Set(monthClasses.map((cls: any) => cls.student_id)).size
      })
    }
    
    return months
  }

  const generateWeeklyData = (classes: any[]): WeeklyData[] => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    const weeklyData: WeeklyData[] = []
    
    days.forEach((day, index) => {
      const dayClasses = classes.filter((cls: any) => {
        const classDate = new Date(cls.date)
        return classDate.getDay() === (index === 0 ? 1 : index === 6 ? 0 : index + 1)
      })
      
      const income = dayClasses.reduce((sum: number, cls: any) => sum + (cls.price || 0), 0)
      
      weeklyData.push({
        day,
        classes: dayClasses.length,
        income
      })
    })
    
    return weeklyData
  }

  const generateSubjectData = (students: any[], courses: any[], classes: any[]): SubjectData[] => {
    const subjectMap = new Map<string, { students: number; income: number }>()
    
    students.forEach((student: any) => {
      const course = courses.find((c: any) => c.id === student.course_id)
      if (course) {
        const subject = course.name
        const studentClasses = classes.filter((cls: any) => cls.student_id === student.id)
        const income = studentClasses.reduce((sum: number, cls: any) => sum + (cls.price || 0), 0)
        
        if (subjectMap.has(subject)) {
          const existing = subjectMap.get(subject)!
          existing.students += 1
          existing.income += income
        } else {
          subjectMap.set(subject, { students: 1, income })
        }
      }
    })
    
    return Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      students: data.students,
      income: data.income
    }))
  }

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = 'primary' 
  }: {
    title: string
    value: string | number
    change?: string
    icon: any
    color?: string
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-xl p-6 card-hover"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground-muted">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {change && (
            <p className="text-sm text-success mt-1 flex items-center">
              <TrendingUp size={16} className="mr-1" />
              {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg bg-${color}/10 flex items-center justify-center`}>
          <Icon size={24} className={`text-${color}`} />
        </div>
      </div>
    </motion.div>
  )

  const ChartCard = ({ 
    title, 
    children, 
    className = '' 
  }: {
    title: string
    children: React.ReactNode
    className?: string
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-effect rounded-xl p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </motion.div>
  )

  const SimpleBarChart = ({ data, xKey, yKey, color = 'primary' }: {
    data: any[]
    xKey: string
    yKey: string
    color?: string
  }) => {
    const maxValue = Math.max(...data.map((item: any) => item[yKey]))
    
    return (
      <div className="space-y-3">
        {data.map((item: any, index: number) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-16 text-sm text-foreground-muted">{item[xKey]}</div>
            <div className="flex-1 bg-background-tertiary rounded-full h-3">
              <div
                className={`bg-${color} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${(item[yKey] / maxValue) * 100}%` }}
              />
            </div>
            <div className="w-16 text-right text-sm font-medium text-foreground">
              {typeof item[yKey] === 'number' && item[yKey] > 0 ? `€${item[yKey]}` : item[yKey]}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <BarChart3 size={32} className="mr-3 text-primary" />
            Estadísticas y Análisis
          </h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download size={16} className="mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Alumnos"
            value={stats.totalStudents}
            icon={Users}
            color="primary"
          />
          <StatCard
            title="Total Clases"
            value={stats.totalClasses}
            icon={Calendar}
            color="accent"
          />
          <StatCard
            title="Ingresos Totales"
            value={formatCurrency(stats.totalIncome)}
            icon={Euro}
            color="success"
          />
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Overview */}
        <ChartCard title="Vista Mensual" className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-foreground mb-3">Ingresos Mensuales</h4>
              <SimpleBarChart
                data={stats.monthlyData}
                xKey="month"
                yKey="income"
                color="success"
              />
            </div>
            <div>
              <h4 className="text-md font-medium text-foreground mb-3">Clases por Mes</h4>
              <SimpleBarChart
                data={stats.monthlyData}
                xKey="month"
                yKey="classes"
                color="primary"
              />
            </div>
          </div>
        </ChartCard>

        {/* Weekly Performance */}
        <ChartCard title="Rendimiento Semanal">
          <SimpleBarChart
            data={stats.weeklyData}
            xKey="day"
            yKey="classes"
            color="accent"
          />
        </ChartCard>

        {/* Subject Performance */}
        <ChartCard title="Rendimiento por Materia">
          <SimpleBarChart
            data={stats.subjectData}
            xKey="subject"
            yKey="income"
            color="warning"
          />
        </ChartCard>
      </div>

      {/* Additional Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <ChartCard title="Insights Adicionales">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-foreground mb-3">Top Materias</h4>
              <div className="space-y-2">
                {stats.subjectData
                  .sort((a: any, b: any) => b.students - a.students)
                  .slice(0, 3)
                  .map((subject: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-background-tertiary rounded-lg">
                      <span className="text-foreground">{subject.subject}</span>
                      <span className="text-foreground-muted">{subject.students} alumnos</span>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h4 className="text-md font-medium text-foreground mb-3">Días Más Activos</h4>
              <div className="space-y-2">
                {stats.weeklyData
                  .sort((a: any, b: any) => b.classes - a.classes)
                  .slice(0, 3)
                  .map((day: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-background-tertiary rounded-lg">
                      <span className="text-foreground">{day.day}</span>
                      <span className="text-foreground-muted">{day.classes} clases</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </ChartCard>
      </motion.div>
    </div>
  )
}

export default StatsPage

