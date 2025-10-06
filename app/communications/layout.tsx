import MainLayout from '@/components/layout/main-layout'

export default function CommunicationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
