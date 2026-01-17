import Checkers from './pages/Checkers';
import Chess from './pages/Chess';
import Clubs from './pages/Clubs';
import Friends from './pages/Friends';
import Home from './pages/Home';
import Invitations from './pages/Invitations';
import Leaderboard from './pages/Leaderboard';
import Notifications from './pages/Notifications';
import Play from './pages/Play';
import Puzzles from './pages/Puzzles';
import RoomDetail from './pages/RoomDetail';
import RoomLobby from './pages/RoomLobby';
import Shop from './pages/Shop';
import Tournaments from './pages/Tournaments';
import GameRoom from './pages/GameRoom';
import Spectate from './pages/Spectate';
import Profile from './pages/Profile';
import Search from './pages/Search';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Checkers": Checkers,
    "Chess": Chess,
    "Clubs": Clubs,
    "Friends": Friends,
    "Home": Home,
    "Invitations": Invitations,
    "Leaderboard": Leaderboard,
    "Notifications": Notifications,
    "Play": Play,
    "Puzzles": Puzzles,
    "RoomDetail": RoomDetail,
    "RoomLobby": RoomLobby,
    "Shop": Shop,
    "Tournaments": Tournaments,
    "GameRoom": GameRoom,
    "Spectate": Spectate,
    "Profile": Profile,
    "Search": Search,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};