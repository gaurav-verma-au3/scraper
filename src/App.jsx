import { WebSocketProvider } from "./contexts/WebSocketProvider";
import Home from "./pages/Home";

function App() {
  return (
    <WebSocketProvider>
      <Home />
    </WebSocketProvider>
  );
}

export default App;
