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

  const buttonVariants = {
    closed: {
      opacity: 0,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
    open: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        delay: i * 0.1,
      },
    }),
  };

  const actions = [
    { icon: UserPlus, label: "Add User", onClick: onAddUser },
    { icon: RefreshCw, label: "Refresh", onClick: onRefresh },
    { icon: Download, label: "Export", onClick: onExport },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-16 right-0 mb-4 space-y-2">
            {actions.map((action, i) => (
              <motion.div
                key={action.label}
                custom={i}
                variants={buttonVariants}
                initial="closed"
                animate="open"
                exit="closed"
              >
                <Button
                  variant="default"
                  size="icon"
                  className="bg-[#004990] hover:bg-[#003870] shadow-lg flex items-center gap-2 w-auto px-4"
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                >
                  <action.icon className="h-4 w-4" />
                  <span className="text-sm">{action.label}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          rotate: isOpen ? 45 : 0,
        }}
      >
        <Button
          variant="default"
          size="icon"
          className="h-14 w-14 rounded-full bg-[#004990] hover:bg-[#003870] shadow-lg"
          onClick={toggleFAB}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  );
}
