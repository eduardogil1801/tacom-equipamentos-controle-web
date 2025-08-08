import { HybridAuthProvider } from "@/hooks/useHybridAuth"; // Novo import

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <HybridAuthProvider> {/* Trocar LocalAuthProvider */}
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </HybridAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;