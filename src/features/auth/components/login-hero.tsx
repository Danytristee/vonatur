"use client";

import { CircleDollarSign, Contact, RotateCcw } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import type { ComponentType } from "react";

const highlights: { icon: ComponentType<{ className?: string }>; label: string }[] = [
  { icon: RotateCcw, label: "Ciclos organizados por temporada" },
  { icon: Contact, label: "Consultoras con su historial completo" },
  { icon: CircleDollarSign, label: "Deudas y pagos siempre al día" },
];

// 19 marks echo Natura's ~19 commercial cycles per year. One is drawn
// brighter than the rest to read as "somewhere in the year's rhythm" —
// deliberately not tied to a real cycle number on a page rendered before login.
const CYCLE_COUNT = 19;
const ACTIVE_INDEX = 12;
const ARC_SPAN_DEGREES = 150;
const ARC_RADIUS = 168;
const ARC_CENTER_X = 170;
const ARC_CENTER_Y = 186;

const cycleMarks = Array.from({ length: CYCLE_COUNT }, (_, index) => {
  const t = index / (CYCLE_COUNT - 1);
  const angleDeg = -ARC_SPAN_DEGREES / 2 + t * ARC_SPAN_DEGREES;
  const angleRad = (angleDeg * Math.PI) / 180;

  return {
    index,
    x: ARC_CENTER_X + ARC_RADIUS * Math.sin(angleRad),
    y: ARC_CENTER_Y - ARC_RADIUS * Math.cos(angleRad),
    isActive: index === ACTIVE_INDEX,
    isPast: index < ACTIVE_INDEX,
  };
});

export function LoginHero() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative hidden overflow-hidden bg-primary px-10 py-12 lg:flex lg:w-[42%] lg:flex-col lg:justify-between xl:w-[38%]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative flex items-center gap-3"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/15 text-base font-bold text-white">
            V
          </div>
          <span className="text-sm font-medium text-white/90">Vonatur</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="relative grid gap-6"
        >
          <h1 className="max-w-xs text-3xl font-semibold leading-tight text-white">
            Todo tu ciclo comercial, en un solo lugar.
          </h1>
          <p className="max-w-xs text-sm leading-6 text-white/80">
            Consolida consultoras, ciclos, puntos y deudas sin depender de
            hojas de cálculo sueltas.
          </p>

          <ul className="grid gap-3">
            {highlights.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-2.5 text-sm text-white/90"
              >
                <item.icon className="size-4 shrink-0 text-white/60" aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="relative flex flex-col items-center">
          <svg
            viewBox="0 0 340 200"
            className="h-auto w-full max-w-sm"
            aria-hidden="true"
          >
            {cycleMarks.map((mark) => (
              <motion.circle
                key={mark.index}
                cx={mark.x}
                cy={mark.y}
                r={mark.isActive ? 6 : 3}
                fill="white"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: mark.isActive ? 1 : mark.isPast ? 0.4 : 0.16,
                }}
                transition={{
                  duration: 0.4,
                  delay: 0.3 + mark.index * 0.03,
                  ease: "easeOut",
                }}
              />
            ))}
          </svg>
          <p className="relative -mt-2 text-xs text-white/50">
            Hecho a medida para consultoras de belleza.
          </p>
        </div>
      </div>
    </MotionConfig>
  );
}
