import clsx from "clsx";

interface LoadingCircleProps {
  strokeWidth?: number;
  className?: string;
}

const LoadingCircle = ({ strokeWidth = 12, className }: LoadingCircleProps) => {
  return (
    <div role="status">
      <svg
        aria-hidden="true"
        className={clsx(
          "inline h-4 w-4 animate-spin stroke-cyan-500 text-cyan-500/30",
          className
        )}
        width="100"
        height="100"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          stroke="currentColor"
          cx="50.0002"
          cy="50"
          r="41.1985"
          strokeWidth={strokeWidth}
        />
        <path
          stroke="currentStroke"
          d="M42.3604 9.50862C44.8362 9.04433 47.3901 8.80151 50.0007 8.80151C67.4385 8.80151 82.3459 19.6352 88.3594 34.939"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingCircle;
