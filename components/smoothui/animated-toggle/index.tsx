"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useState,
} from "react";

export interface AnimatedToggleProps {
  /** Controlled checked state */
  checked?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Default checked state for uncontrolled mode */
  defaultChecked?: boolean;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Icons for on/off states (only used with icon variant) */
  icons?: { on: ReactNode; off: ReactNode };
  /** Accessible label for the toggle */
  label?: string;
  /** Callback when checked state changes */
  onChange?: (checked: boolean) => void;
  /** Track hue when checked (candy appearance) */
  color?: "accent" | "neutral" | "destructive" | "blue" | "amber" | "green";
  /** HTML id for label association */
  id?: string;
  /** Size of the toggle */
  size?: "xs" | "sm" | "md" | "lg";
  /** Checked-track appearance */
  trackAppearance?: "default" | "candy";
  /** Visual variant of the toggle */
  variant?: "default" | "morph" | "icon";
}

const COLOR_CLASSES: Record<
  NonNullable<AnimatedToggleProps["color"]>,
  string
> = {
  accent:
    "[--btn-fg:#fff] [--btn-hover:var(--color-brand-secondary)] [--btn:var(--color-brand)]",
  neutral:
    "[--btn-fg:var(--color-background)] [--btn-hover:var(--color-smooth-900)] [--btn:var(--color-foreground)]",
  destructive:
    "[--btn-fg:#fff] [--btn-hover:color-mix(in_oklab,var(--color-destructive)_85%,black)] [--btn:var(--color-destructive)]",
  blue: "[--btn-fg:var(--color-blue-fg)] [--btn-hover:var(--color-blue-hover)] [--btn:var(--color-blue)]",
  amber:
    "[--btn-fg:var(--color-amber-fg)] [--btn-hover:var(--color-amber-hover)] [--btn:var(--color-amber)]",
  green:
    "[--btn-fg:var(--color-green-fg)] [--btn-hover:var(--color-green-hover)] [--btn:var(--color-green)]",
};

const SPRING = {
  bounce: 0.1,
  duration: 0.25,
  type: "spring" as const,
};

const SIZES = {
  xs: {
    icon: "size-2",
    thumb: "size-3",
    thumbTranslate: 12,
    track: "w-7 h-4",
  },
  lg: {
    icon: "size-3.5",
    thumb: "size-6",
    thumbTranslate: 24,
    track: "w-[52px] h-7",
  },
  md: {
    icon: "size-3",
    thumb: "size-5",
    thumbTranslate: 20,
    track: "w-11 h-6",
  },
  sm: {
    icon: "size-2.5",
    thumb: "size-4",
    thumbTranslate: 16,
    track: "w-9 h-5",
  },
};

const AnimatedToggle = ({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  variant = "default",
  trackAppearance = "default",
  color = "accent",
  icons,
  size = "md",
  disabled = false,
  id,
  label,
  className,
}: AnimatedToggleProps) => {
  const shouldReduceMotion = useReducedMotion();

  const [internalChecked, setInternalChecked] = useState(defaultChecked);

  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const handleToggle = useCallback(() => {
    if (disabled) {
      return;
    }

    const newValue = !checked;
    if (!isControlled) {
      setInternalChecked(newValue);
    }
    onChange?.(newValue);
  }, [checked, disabled, isControlled, onChange]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  const sizeConfig = SIZES[size];
  const checkedTrackClass =
    trackAppearance === "candy" && checked
      ? cn(
          COLOR_CLASSES[color],
          "border-[0.5px] border-white/25 bg-gradient-to-b from-[var(--btn,var(--color-brand))] to-[var(--btn-hover,var(--color-brand-secondary))] shadow-black/20 shadow-md ring-1 ring-[color-mix(in_oklab,var(--color-foreground)_15%,var(--btn,var(--color-brand)))]",
        )
      : checked
        ? "bg-brand"
        : "bg-muted-foreground/30";

  const getThumbBorderRadius = () => {
    if (variant !== "morph" || shouldReduceMotion) {
      return 9999;
    }
    return checked ? 9999 : 6;
  };

  const getThumbTransform = () => {
    const translateX = checked ? sizeConfig.thumbTranslate : 0;
    return translateX;
  };

  return (
    <button
      id={id}
      aria-checked={checked}
      aria-label={label}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checkedTrackClass,
        disabled && "cursor-not-allowed opacity-50",
        sizeConfig.track,
        className
      )}
      disabled={disabled}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      role="switch"
      type="button"
    >
      <motion.span
        animate={
          shouldReduceMotion
            ? {
                x: getThumbTransform(),
              }
            : {
                borderRadius: getThumbBorderRadius(),
                x: getThumbTransform(),
              }
        }
        className={cn(
          "pointer-events-none flex items-center justify-center rounded-full border border-border bg-background shadow-sm",
          sizeConfig.thumb
        )}
        initial={false}
        style={{
          borderRadius: getThumbBorderRadius(),
        }}
        transition={shouldReduceMotion ? { duration: 0 } : SPRING}
      >
        {variant === "icon" && icons && (
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, rotate: 0, scale: 1 }
              }
              className={cn(
                "flex items-center justify-center text-muted-foreground",
                sizeConfig.icon
              )}
              exit={
                shouldReduceMotion
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { opacity: 0, rotate: -90, scale: 0.5 }
              }
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, rotate: 90, scale: 0.5 }
              }
              key={checked ? "on" : "off"}
              transition={shouldReduceMotion ? { duration: 0 } : SPRING}
            >
              {checked ? icons.on : icons.off}
            </motion.span>
          </AnimatePresence>
        )}
      </motion.span>
    </button>
  );
};

/** SmoothUI preset matching instructor toolbar toggles (xs · blue · candy track · morph thumb). */
export const XS_BLUE_CANDY_MORPH_TOGGLE = {
  color: "blue",
  size: "xs",
  trackAppearance: "candy",
  variant: "morph",
} as const satisfies Partial<AnimatedToggleProps>;

export default AnimatedToggle;
