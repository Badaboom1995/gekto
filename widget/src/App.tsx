import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/80 text-white rounded-lg shadow-xl">
      <h1 className="text-lg font-bold mb-2">Master agent</h1>
      <button
        onClick={() => setCount((count) => count + 1)}
        className="px-3 py-1 bg-blue-500 rounded hover:bg-blue-600"
      >
        count is {count}
      </button>
    </div>
  )
}

export default App
