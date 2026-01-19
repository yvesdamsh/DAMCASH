import Checkers from './pages/Checkers';
import Chess from './pages/Chess';
import Clubs from './pages/Clubs';
import Friends from './pages/Friends';
import GameRoom from './pages/GameRoom';
import Home from './pages/Home';
import Invitations from './pages/Invitations';
import Leaderboard from './pages/Leaderboard';
import Notifications from './pages/Notifications';
import Play from './pages/Play';
import Profile from './pages/Profile';
import Puzzles from './pages/Puzzles';
import RoomDetail from './pages/RoomDetail';
import RoomLobby from './pages/RoomLobby';
import Search from './pages/Search';
import Shop from './pages/Shop';
import Spectate from './pages/Spectate';
import Tournaments from './pages/Tournaments';
import History from './pages/History';
import ReviewGame from './pages/ReviewGame';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Checkers": Checkers,
    "Chess": Chess,
    "Clubs": Clubs,
    "Friends": Friends,
    "GameRoom": GameRoom,
    "Home": Home,
    "Invitations": Invitations,
    "Leaderboard": Leaderboard,
    "Notifications": Notifications,
    "Play": Play,
    "Profile": Profile,
    "Puzzles": Puzzles,
    "RoomDetail": RoomDetail,
    "RoomLobby": RoomLobby,
    "Search": Search,
    "Shop": Shop,
    "Spectate": Spectate,
    "Tournaments": Tournaments,
    "History": History,
    "ReviewGame": ReviewGame,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};