'use client';

import { animate, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

type AnimatedCounterProps = {
  value: number;
  format?: (value: number) => string;
  className?: string;
};

export function AnimatedCounter({
  value,
  format = (n) => Math.round(n).toLocaleString('en-GB'),
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [display, setDisplay] = useState(format(0));

  useEffect(() => {
    if (!inView) return;

    const controls = animate(0, value, {
      duration: 1.8,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(format(latest)),
    });

    return () => controls.stop();
  }, [inView, value, format]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
