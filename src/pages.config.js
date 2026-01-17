import Home from './pages/Home';
import Play from './pages/Play';
import Chess from './pages/Chess';
import Checkers from './pages/Checkers';
import Tournaments from './pages/Tournaments';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Play": Play,
    "Chess": Chess,
    "Checkers": Checkers,
    "Tournaments": Tournaments,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};