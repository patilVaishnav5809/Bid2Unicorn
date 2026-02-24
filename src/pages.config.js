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
import AdminDashboard from './pages/AdminDashboard';
import AuctionSettings from './pages/AuctionSettings';
import Bids from './pages/Bids';
import BreakingNews from './pages/BreakingNews';

import Leaderboard from './pages/Leaderboard';
import PowerCards from './pages/PowerCards';
import Startups from './pages/Startups';
import Teams from './pages/Teams';
import ScreenDashboard from './pages/ScreenDashboard';
// import UserAuction from './pages/UserAuction';
import UserDashboard from './pages/UserDashboard';
// import UserLeaderboard from './pages/UserLeaderboard';
// import UserPortfolio from './pages/UserPortfolio';
// import InviteUsers from './pages/InviteUsers';
import TeamRegistration from './pages/TeamRegistration';
import DatabaseViewer from './pages/DatabaseViewer';
import Landing from './pages/Landing';
import Login from './pages/Login';
import FinalJudgement from './pages/FinalJudgement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AuctionSettings": AuctionSettings,
    "Bids": Bids,
    "BreakingNews": BreakingNews,

    "Landing": Landing,
    "Login": Login,
    "Leaderboard": Leaderboard,
    "PowerCards": PowerCards,
    "Startups": Startups,
    "Teams": Teams,
    "ScreenDashboard": ScreenDashboard,
    // "UserAuction": UserAuction,
    "UserDashboard": UserDashboard,
    // "UserLeaderboard": UserLeaderboard,
    // "UserPortfolio": UserPortfolio,
    "TeamRegistration": TeamRegistration,
    "DatabaseViewer": DatabaseViewer,
    "FinalJudgement": FinalJudgement,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};
