import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { QuranProvider } from "./contexts/QuranContext";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DetailView = lazy(() => import("./pages/DetailView"));
const SurahProfile = lazy(() => import("./pages/SurahProfile"));
const RootLengthExplorer = lazy(() => import("./pages/RootLengthExplorer"));

// Loading fallback
const PageLoader = () => (
  <div className="flex h-[50vh] w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/dashboard"} component={Dashboard} />
        <Route path={"/details/:root/:type/:value"} component={DetailView} />
        <Route path={"/surah/:id"} component={SurahProfile} />
        <Route path={"/morphology/:length"} component={RootLengthExplorer} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

import { Analytics } from "@vercel/analytics/react";
import { MainLayout } from "./components/layout/MainLayout";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system">
        <QuranProvider>
          <TooltipProvider>
            <Toaster />
            <MainLayout>
              <Router />
            </MainLayout>
            <Analytics />
          </TooltipProvider>
        </QuranProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
