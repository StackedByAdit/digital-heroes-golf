'use client';

import { animate, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

type AnimatedCounterProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  /** @deprecated Use prefix/suffix instead */
  format?: (value: number) => string;
};

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1.8,
  className,
  format,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const prefersReducedMotion = useReducedMotion();
  const toDisplay = (n: number) =>
    format
      ? format(n)
      : `${prefix}${Math.round(n).toLocaleString('en-GB')}${suffix}`;
  const [display, setDisplay] = useState(toDisplay(0));

  useEffect(() => {
    if (!inView) return;

    if (prefersReducedMotion) {
      setDisplay(toDisplay(value));
      return;
    }

    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(toDisplay(latest)),
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toDisplay derived from stable props
  }, [inView, value, duration, prefersReducedMotion, format, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
