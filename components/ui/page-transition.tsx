"use client";

import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
}

/**
 * Page Transition Wrapper
 *
 * Wraps page content with smooth entrance animations.
 * Use on main content areas only - sidebars and headers should remain static.
 *
 * Animation:
 * - Initial: opacity 0, translateY +20px
 * - Animate: opacity 1, translateY 0
 * - Exit: opacity 0, translateY -10px
 * - Duration: 0.3s with cubic-bezier easing
 *
 * Note: This uses native CSS animations instead of Framer Motion
 * to reduce bundle size and improve performance.
 *
 * Usage:
 * Wrap your page content in PageTransition for smooth entrance animations.
 * Only wrap the content area, not sidebars or headers.
 */
export function PageTransition({
  children,
  duration = 300,
  delay = 0,
}: PageTransitionProps) {
  return (
    <div
      style={{
        animation: `pageTransitionIn ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms forwards`,
        opacity: 0,
        transform: "translateY(20px)",
      }}
    >
      {children}
    </div>
  );
}

/**
 * CSS Animation Keyframes (add to globals.css or module styles)
 *
 * @keyframes pageTransitionIn {
 *   from {
 *     opacity: 0;
 *     transform: translateY(20px);
 *   }
 *   to {
 *     opacity: 1;
 *     transform: translateY(0);
 *   }
 * }
 *
 * Note: The pageTransitionOut animation is for route exits,
 * typically handled by layout transitions rather than individual pages.
 */

/**
 * Staggered Page Transition (for multiple elements)
 *
 * Animates multiple children with staggered delays
 */
export function PageTransitionStaggered({
  children,
  duration = 300,
  staggerDelay = 100,
}: {
  children: ReactNode;
  duration?: number;
  staggerDelay?: number;
}) {
  const childrenArray = Array.isArray(children) ? children : [children];

  return (
    <>
      {childrenArray.map((child, index) => (
        <PageTransition
          key={index}
          duration={duration}
          delay={index * staggerDelay}
        >
          {child}
        </PageTransition>
      ))}
    </>
  );
}

/**
 * Fast Transition (for modals, overlays)
 *
 * Quicker animation for non-page transitions
 */
export function TransitionFast({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PageTransition duration={150} delay={0}>
      {children}
    </PageTransition>
  );
}
