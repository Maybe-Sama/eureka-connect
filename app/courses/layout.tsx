import MainLayout from '@/components/layout/main-layout'

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
