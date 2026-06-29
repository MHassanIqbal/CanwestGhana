import { useEffect, useState } from "react";

interface FullPageLoaderProps {
  title?: string;
  description?: string;
  delayMs?: number;
}

const FullPageLoader: React.FC<FullPageLoaderProps> = ({
  title = "Loading…",
  description = "Please wait a moment.",
  delayMs = 200,
}) => {
  const [visible, setVisible] = useState(delayMs === 0);

  useEffect(() => {
    if (delayMs === 0) return;

    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto z-99999">
      <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px]"></div>
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 border-primary/50 border-t-transparent opacity-50" />
        </div>

        {title && (
          <h3 className="mt-12 text-xl font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h3>
        )}

        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-center sm:text-base">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default FullPageLoader;
