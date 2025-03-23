import * as React from "react";
import ReactConfetti from "react-confetti";

export function Confetti() {
  const [windowSize, setWindowSize] = React.useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  React.useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <ReactConfetti
      width={windowSize.width}
      height={windowSize.height}
      numberOfPieces={200}
      recycle={false}
      tweenDuration={10000}
      initialVelocityX={5}
      initialVelocityY={2}
      gravity={0.1}
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}
