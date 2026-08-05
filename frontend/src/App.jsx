// Handles Routing for React Frontend
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { DarkModeProvider } from './context/DarkModeContext';
import LandingPage        from './LandingPage';
import LoginPage          from './pages/auth/LoginPage';
import RegisterPage       from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import HomePage           from './components/Home/Homepage';
import AdvancedNotesApp   from './components/Add_note/AdvancedNotesApp';
import WeatherApp         from './components/WeatherApp/weather_box';
import ProfilePage        from './pages/profile/ProfilePage';
import BookmarksPage      from './pages/bookmarks/BookmarksPage';

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <Routes>
          <Route path="/"                element={<LandingPage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/home"            element={<HomePage />} />
          <Route path="/weather"         element={<WeatherApp />} />
          <Route path="/addnote"         element={<AdvancedNotesApp />} />
          <Route path="/profile"         element={<ProfilePage />} />
          <Route path="/bookmarks"       element={<BookmarksPage />} />
        </Routes>
      </Router>
    </DarkModeProvider>
  );
}

export default App;
