import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FlowCanvas from './components/FlowCanvas';
import ControlPanel from './components/ControlPanel';
import RoutingModal from './components/RoutingModal';
import RenameModal from './components/RenameModal';
import SavedConfigurationsList from './components/SavedConfigurationsList';
import AiHelpChat from './components/AiHelpChat';
import { useStore } from './store/useStore';

function App() {
  const { mode, capabilities, fetchCapabilities } = useStore();

  useEffect(() => {
    fetchCapabilities();
  }, [fetchCapabilities]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 overflow-hidden text-slate-100 font-sans">
      {/* Top Header */}
      <Navbar />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 w-full overflow-hidden relative">
        {mode === 'saved' ? (
          <SavedConfigurationsList />
        ) : (
          <>
            <ReactFlowProvider>
              {/* Main Interactive Canvas Area */}
              <div className="flex-1 h-full w-full relative">
                <FlowCanvas />
                
                {/* Floating Simulation HUD Control Console */}
                <ControlPanel />

                {/* Configures routing tables on-connection creation */}
                <RoutingModal />

                {/* Rename popup on node click */}
                <RenameModal />

                {/* AI Architecture Helper (Design Mode only when AI_HELP is active) */}
                {mode === 'edit' && capabilities.includes('AI_HELP') && <AiHelpChat />}
              </div>
            </ReactFlowProvider>

            {/* Configuration & inspector Side Panel */}
            <Sidebar />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
