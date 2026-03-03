/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Admin from './pages/Admin';
import AdvancedStatistics from './pages/AdvancedStatistics';
import Chat from './pages/Chat';
import Checkers from './pages/Checkers';
import Chess from './pages/Chess';
import Clubs from './pages/Clubs';
import CupCalendar from './pages/CupCalendar';
import Friends from './pages/Friends';
import GameReviews from './pages/GameReviews';
import GameRoom from './pages/GameRoom';
import History from './pages/History';
import Home from './pages/Home';
import Invitations from './pages/Invitations';
import Leaderboard from './pages/Leaderboard';
import MiniTournaments from './pages/MiniTournaments';
import Notifications from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import Play from './pages/Play';
import PlayCheckers from './pages/PlayCheckers';
import PlayChess from './pages/PlayChess';
import Profile from './pages/Profile';
import Puzzles from './pages/Puzzles';
import ReviewGame from './pages/ReviewGame';
import RoomDetail from './pages/RoomDetail';
import RoomLobby from './pages/RoomLobby';
import Search from './pages/Search';
import Shop from './pages/Shop';
import Spectate from './pages/Spectate';
import Statistics from './pages/Statistics';
import Tournaments from './pages/Tournaments';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "AdvancedStatistics": AdvancedStatistics,
    "Chat": Chat,
    "Checkers": Checkers,
    "Chess": Chess,
    "Clubs": Clubs,
    "CupCalendar": CupCalendar,
    "Friends": Friends,
    "GameReviews": GameReviews,
    "GameRoom": GameRoom,
    "History": History,
    "Home": Home,
    "Invitations": Invitations,
    "Leaderboard": Leaderboard,
    "MiniTournaments": MiniTournaments,
    "Notifications": Notifications,
    "Onboarding": Onboarding,
    "Play": Play,
    "PlayCheckers": PlayCheckers,
    "PlayChess": PlayChess,
    "Profile": Profile,
    "Puzzles": Puzzles,
    "ReviewGame": ReviewGame,
    "RoomDetail": RoomDetail,
    "RoomLobby": RoomLobby,
    "Search": Search,
    "Shop": Shop,
    "Spectate": Spectate,
    "Statistics": Statistics,
    "Tournaments": Tournaments,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};