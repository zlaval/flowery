import { ReactFlowProvider } from '@xyflow/react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FlowCanvas from './components/FlowCanvas';
import ControlPanel from './components/ControlPanel';

function App() {
  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 overflow-hidden text-slate-100 font-sans">
      {/* Top Header */}
      <Navbar />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 w-full overflow-hidden relative">
        <ReactFlowProvider>
          {/* Main Interactive Canvas Area */}
          <div className="flex-1 h-full w-full relative">
            <FlowCanvas />
            
            {/* Floating Simulation HUD Control Console */}
            <ControlPanel />
          </div>
        </ReactFlowProvider>

        {/* Configuration & inspector Side Panel */}
        <Sidebar />
      </div>
    </div>
  );
}

export default App;
