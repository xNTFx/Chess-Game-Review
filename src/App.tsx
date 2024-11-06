import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import GameReview from "./pages/GameReview";

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="overflow-hidden bg-slate-700 text-white">
          <GameReview />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
