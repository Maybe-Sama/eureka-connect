import MainLayout from '@/components/layout/main-layout'

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
