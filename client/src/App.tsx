import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { QuranProvider } from "./contexts/QuranContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import DetailView from "./pages/DetailView";
import SurahProfile from "./pages/SurahProfile";
import RootLengthExplorer from "./pages/RootLengthExplorer";

function Router() {
  return (
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
  );
}

import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system">
        <QuranProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <Analytics />
          </TooltipProvider>
        </QuranProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
