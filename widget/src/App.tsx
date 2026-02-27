import { LizardsSwarm } from './components/LizardsSwarm'
import { AgentProvider } from './context/AgentContext'
import { ServerStateProvider } from './context/ServerStateProvider'

function App() {
  return (
    <ServerStateProvider>
      <AgentProvider>
        <LizardsSwarm />
      </AgentProvider>
    </ServerStateProvider>
  )
}

export default App
