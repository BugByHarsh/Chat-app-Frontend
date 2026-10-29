import { Outlet, useNavigate } from "react-router-dom";
import SideBar from "./Sidebar";
import { motion } from "framer-motion";
import { useEffect } from "react";

export default function MainContainer() {
  const navigateTo = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigateTo("/");
    }
  }, [navigateTo]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="flex h-[100dvh] w-full overflow-hidden"
    >
      <SideBar />
      <div className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </motion.div>
  );
}
