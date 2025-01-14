import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/Home/leaderBoard";
import Admin from "@/pages/Admin/Admin";
import UserInfo from "@/pages/User/UserInfo";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/Admin" element={<Admin />} />
      <Route path="/User" element={<UserInfo />} />
    </Routes>
  );
}
