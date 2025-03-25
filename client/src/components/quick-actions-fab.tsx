import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, UserPlus, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionsFABProps {
  onAddUser: () => void;
  onRefresh: () => void;
  onExport: () => void;
}

export function QuickActionsFAB({
  onAddUser,
  onRefresh,
  onExport,
}: QuickActionsFABProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleFAB = () => setIsOpen(!isOpen);

  // Enhanced spring animation for menu items
  const menuVariants = {
    closed: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    open: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: i * 0.1,
      },
    }),
  };

  // Button hover animation
  const buttonVariants = {
    rest: {
      scale: 1,
      backgroundColor: "#004990",
    },
    hover: {
      scale: 1.1,
      backgroundColor: "#003870",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 17,
      },
    },
    tap: {
      scale: 0.95,
    },
  };

  const actions = [
    { icon: UserPlus, label: "Add Employee", onClick: onAddUser },
    { icon: RefreshCw, label: "Refresh", onClick: onRefresh },
    { icon: Download, label: "Export", onClick: onExport },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-16 right-0 mb-4 space-y-3">
            {actions.map((action, i) => (
              <motion.div
                key={action.label}
                custom={i}
                variants={menuVariants}
                initial="closed"
                animate="open"
                exit="closed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.button
                  className="bg-[#004990] hover:bg-[#003870] text-white shadow-lg flex items-center gap-2 w-auto px-4 py-2 rounded-md"
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  whileHover={{
                    backgroundColor: "#003870",
                    transition: { duration: 0.2 },
                  }}
                >
                  <action.icon className="h-4 w-4" />
                  <span className="text-sm">{action.label}</span>
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        variants={buttonVariants}
      >
        <motion.button
          className="h-14 w-14 rounded-full bg-[#004990] text-white shadow-lg flex items-center justify-center relative overflow-hidden"
          onClick={toggleFAB}
          animate={{
            rotate: isOpen ? 45 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
        >
          <Plus className="h-6 w-6" />

          {/* Ripple effect on click */}
          <motion.div
            className="absolute w-full h-full rounded-full bg-white/20"
            initial={{ scale: 0, opacity: 0.5 }}
            whileTap={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        </motion.button>
      </motion.div>
    </div>
  );
}