import MainLayout from '@/components/layout/main-layout'

export default function ClassTrackingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
