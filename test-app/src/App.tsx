import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import GameView from './pages/GameView';
import LandingPage from './pages/LandingPage';
import ArcadeMachinePage from './pages/ArcadeMachinePage';

function HomePageRoute() {
  const navigate = useNavigate();

  const handlePlay = (id: string) => {
    // Launch games on the 3D arcade machine
    navigate(`/machine/${id}`);
  };

  return <HomePage onPlay={handlePlay} />;
}

function GameViewRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/arcade');
  };

  return <GameView gameId={id || ''} onClose={handleClose} />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/arcade" element={<HomePageRoute />} />
      <Route path="/machine" element={<ArcadeMachinePage />} />
      <Route path="/machine/:gameId" element={<ArcadeMachinePage />} />
      <Route path="/game/:id" element={<GameViewRoute />} />
    </Routes>
  );
}

export default App;
