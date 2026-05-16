import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RouteTransition } from "@/components/layout/RouteTransition";
import { FloatingCompare } from "@/components/shared/FloatingCompare";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen"><RouteTransition>{children}</RouteTransition></main>
      <FloatingCompare />
      <Footer />
    </>
  );
}
