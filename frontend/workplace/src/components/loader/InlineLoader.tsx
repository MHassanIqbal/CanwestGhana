import { useEffect, useState } from "react";

interface InlineLoaderProps {
  text?: string;
  delayMs?: number;
}

const InlineLoader: React.FC<InlineLoaderProps> = ({
  text = "Loading…",
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
    <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="text-sm">{text}</span>
    </div>
  );
};

export default InlineLoader;
