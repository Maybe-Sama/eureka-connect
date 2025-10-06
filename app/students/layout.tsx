import MainLayout from '@/components/layout/main-layout'

export default function StudentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
