import Home from './pages/Home';
import Play from './pages/Play';
import Chess from './pages/Chess';
import Checkers from './pages/Checkers';
import Tournaments from './pages/Tournaments';
import Search from './pages/Search';
import Invitations from './pages/Invitations';
import Profile from './pages/Profile';
import Shop from './pages/Shop';
import Friends from './pages/Friends';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Play": Play,
    "Chess": Chess,
    "Checkers": Checkers,
    "Tournaments": Tournaments,
    "Search": Search,
    "Invitations": Invitations,
    "Profile": Profile,
    "Shop": Shop,
    "Friends": Friends,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};