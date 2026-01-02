import { LizardsSwarm } from './components/LizardsSwarm'
import { AgentProvider } from './context/AgentContext'

function App() {
  return (
    <AgentProvider>
      <LizardsSwarm />
    </AgentProvider>
  )
}

export default App
