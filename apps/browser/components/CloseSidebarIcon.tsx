import colors from "tailwindcss/colors";
import clsx from "clsx";
import { animated, easings, useSpring } from "@react-spring/web";

type CloseSidebarIconType = {
  hoveringSidebarButton: boolean;
  sidebarOpen: boolean;
};

const CloseSidebarIcon = ({
  hoveringSidebarButton,
  sidebarOpen,
}: CloseSidebarIconType) => {
  const { d, stroke } = useSpring({
    d: hoveringSidebarButton
      ? "M16 6.18872L12 16L16 25.8113"
      : "M16.0002 6.18872L15.9902 16L16.0002 25.8113",
    stroke: hoveringSidebarButton ? colors.white : colors.zinc[500],
    config: {
      duration: 300,
    },
  });

  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx({ "rotate-180 transform": !sidebarOpen })}
    >
      <animated.path
        d={d}
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CloseSidebarIcon;
