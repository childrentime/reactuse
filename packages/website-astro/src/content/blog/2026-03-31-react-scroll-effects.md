---
title: "React Scroll Effects Without External Libraries"
description: "Learn how to build scroll-linked animations, scroll locking, smooth scrolling, and sticky headers in React using hooks from ReactUse."
slug: react-scroll-effects
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-31
tags: [react, hooks, scroll, tutorial, useScroll]
keywords: [react scroll effects, useScroll, useScrollLock, scroll hooks, react sticky header, scroll-linked animations, useScrollIntoView]
image: /img/og.png
---

# React Scroll Effects Without External Libraries

Scroll is the most fundamental user interaction on the web. Progress bars that fill as you read, headers that shrink and stick, modals that lock the page behind them, "scroll to section" buttons -- these effects appear on nearly every modern site. Yet implementing them correctly in React means juggling `addEventListener`, `IntersectionObserver`, `overflow` styles, and a surprising number of edge cases. Most developers either pull in a heavy animation library or spend hours writing brittle imperative code.

<!-- truncate -->

This post takes a different path. We will tackle six common scroll scenarios, starting each time with the manual implementation so you understand the mechanics, then replacing it with a purpose-built hook from [ReactUse](https://reactuse.com). By the end you will have a toolkit of composable, SSR-safe hooks that handle scroll tracking, scroll locking, smooth scrolling, sticky detection, visibility detection, and intersection observing -- all without a single external animation or scroll library.

## 1. Tracking Scroll Position

### The Manual Way

Tracking how far a user has scrolled seems straightforward until you account for throttling, direction detection, and knowing when the user has reached the edges.

```tsx
import { useEffect, useRef, useState } from "react";

function ManualScrollTracker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [direction, setDirection] = useState<"up" | "down">("down");
  const lastY = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const y = el.scrollTop;
      setDirection(y > lastY.current ? "down" : "up");
      lastY.current = y;
      setScrollY(y);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const progress = containerRef.current
    ? scrollY /
      (containerRef.current.scrollHeight - containerRef.current.clientHeight)
    : 0;

  return (
    <div>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 4,
          width: `${progress * 100}%`,
          background: "#4f46e5",
          transition: "width 0.1s",
        }}
      />
      <div
        ref={containerRef}
        style={{ height: "100vh", overflow: "auto" }}
      >
        {/* long content */}
      </div>
    </div>
  );
}
```

This gets the job done for a simple progress bar. But it does not tell you whether the user has reached the bottom, it has no horizontal scroll tracking, and the direction detection is naive (a single-pixel bounce during momentum scroll will flip it). Adding "arriving at edge" thresholds means even more state and math.

### With useScroll

[`useScroll`](https://reactuse.com/browser/usescroll/) returns the current `x` and `y` offsets, scroll direction on both axes, plus boolean `isScrolling` and `arrivedState` fields that tell you whether the user has reached the top, bottom, left, or right edge.

```tsx
import { useScroll } from "@reactuses/core";
import { useRef } from "react";

function ScrollTracker() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [position, direction, arrivedState, isScrolling] = useScroll(
    containerRef,
    { throttle: 50 }
  );

  const el = containerRef.current;
  const progress = el
    ? position.y / (el.scrollHeight - el.clientHeight)
    : 0;

  return (
    <div>
      {/* Progress bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 4,
          width: `${Math.min(progress * 100, 100)}%`,
          background: "#4f46e5",
          zIndex: 50,
        }}
      />

      {/* Scroll info overlay */}
      <div
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          padding: "8px 16px",
          background: "#1e293b",
          color: "#fff",
          borderRadius: 8,
          fontSize: 14,
          zIndex: 50,
        }}
      >
        <div>Y: {Math.round(position.y)}px</div>
        <div>Direction: {direction.y ?? "none"}</div>
        <div>
          {arrivedState.bottom
            ? "You reached the bottom!"
            : isScrolling
              ? "Scrolling..."
              : "Idle"}
        </div>
      </div>

      <div
        ref={containerRef}
        style={{ height: "100vh", overflow: "auto" }}
      >
        {Array.from({ length: 100 }, (_, i) => (
          <p key={i} style={{ padding: "8px 16px" }}>
            Paragraph {i + 1}
          </p>
        ))}
      </div>
    </div>
  );
}
```

One hook call replaces all the manual event wiring, direction tracking, and edge detection. The built-in `throttle` option keeps performance smooth even on rapid-fire scroll events.

## 2. Locking Scroll for Modals

### The Manual Way

When you open a modal, you need to prevent the page behind it from scrolling. The classic approach is to toggle `overflow: hidden` on the body:

```tsx
import { useEffect, useState } from "react";

function ManualModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              maxWidth: 400,
            }}
          >
            <h2>Modal Title</h2>
            <p>The page behind this modal cannot scroll.</p>
            <button onClick={() => setIsOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
```

This works on desktop browsers, but the `position: fixed` trick causes the page to jump on iOS Safari if you don't carefully save and restore the scroll position. It also does not handle multiple overlapping modals (opening a confirmation dialog from within a modal) or scrollable containers other than the body.

### With useScrollLock

[`useScrollLock`](https://reactuse.com/browser/usescrolllock/) handles all these edge cases. Pass it a ref to the element you want to lock -- typically `document.body` -- and a boolean to control the lock state.

```tsx
import { useScrollLock } from "@reactuses/core";
import { useState } from "react";

function Modal() {
  const [isOpen, setIsOpen] = useState(false);

  useScrollLock(
    typeof document !== "undefined" ? document.body : null,
    isOpen
  );

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              maxWidth: 400,
            }}
          >
            <h2>Modal Title</h2>
            <p>Scroll is locked. Try scrolling the page behind.</p>
            <button onClick={() => setIsOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
```

One line to lock, automatic unlock on unmount, SSR-safe with the `document` guard. The scroll position is preserved correctly across all browsers.

## 3. Smooth Scroll to a Section

### The Manual Way

"Scroll to" buttons that jump to a section on the page are common in landing pages. The imperative approach:

```tsx
import { useRef } from "react";

function ManualScrollTo() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const scrollToSection = () => {
    sectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div>
      <nav style={{ position: "fixed", top: 0, padding: 16, zIndex: 10 }}>
        <button onClick={scrollToSection}>Go to Features</button>
      </nav>

      <div style={{ height: "100vh", background: "#f1f5f9" }}>
        <h1 style={{ paddingTop: 80 }}>Hero Section</h1>
      </div>

      <div ref={sectionRef} style={{ padding: 40 }}>
        <h2>Features</h2>
        <p>Feature content here...</p>
      </div>
    </div>
  );
}
```

`scrollIntoView` is fine for basic cases, but it does not let you control the easing curve, the scroll axis, or the offset (important when you have a fixed header that would overlap the target). There is also no way to know when the scrolling animation has completed.

### With useScrollIntoView

[`useScrollIntoView`](https://reactuse.com/browser/usescrollintoview/) gives you fine-grained control over the scroll animation, including custom duration, easing, axis, offset, and an `onComplete` callback.

```tsx
import { useScrollIntoView } from "@reactuses/core";
import { useRef } from "react";

function SmoothScrollPage() {
  const targetRef = useRef<HTMLDivElement>(null);

  const { scrollIntoView } = useScrollIntoView(targetRef, {
    duration: 800,
    offset: 80, // account for a fixed header
  });

  return (
    <div>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          background: "#1e293b",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          zIndex: 50,
        }}
      >
        <button
          onClick={() => scrollIntoView({ alignment: "start" })}
          style={{
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Jump to Pricing
        </button>
      </nav>

      <div style={{ height: "150vh", paddingTop: 80 }}>
        <h1>Hero</h1>
        <p>Scroll down or click the button above.</p>
      </div>

      <div ref={targetRef} style={{ padding: 40, background: "#eef2ff" }}>
        <h2>Pricing</h2>
        <p>Plans and pricing details...</p>
      </div>

      <div style={{ height: "100vh" }} />
    </div>
  );
}
```

The `offset` option ensures the section appears below your fixed header rather than being hidden behind it. The smooth animation uses a configurable easing function, and the hook cleans up properly if the component unmounts mid-scroll.

## 4. Detecting Sticky Headers

### The Manual Way

A common pattern is to change a header's appearance once it becomes sticky (adding a shadow, shrinking its height, etc.). Detecting this manually requires an `IntersectionObserver` with a sentinel element:

```tsx
import { useEffect, useRef, useState } from "react";

function ManualStickyHeader() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      {/* Sentinel: when this scrolls out of view, the header is stuck */}
      <div ref={sentinelRef} style={{ height: 1 }} />
      <header
        style={{
          position: "sticky",
          top: 0,
          padding: isStuck ? "8px 24px" : "16px 24px",
          background: isStuck ? "rgba(255,255,255,0.95)" : "#fff",
          boxShadow: isStuck ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
          transition: "all 0.2s",
          zIndex: 40,
        }}
      >
        <h1 style={{ margin: 0, fontSize: isStuck ? 18 : 24 }}>
          My App
        </h1>
      </header>
      <main style={{ padding: 24 }}>
        {Array.from({ length: 80 }, (_, i) => (
          <p key={i}>Content paragraph {i + 1}</p>
        ))}
      </main>
    </div>
  );
}
```

This sentinel-based approach works but is fragile. You need to position the sentinel correctly, manage the observer lifecycle, and keep the sentinel in sync if the DOM structure changes.

### With useSticky

[`useSticky`](https://reactuse.com/element/usesticky/) handles sticky detection cleanly. It returns a boolean that flips to `true` when the element enters its stuck state.

```tsx
import { useSticky } from "@reactuses/core";
import { useRef } from "react";

function StickyHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const [isStuck] = useSticky(headerRef);

  return (
    <div>
      <header
        ref={headerRef}
        style={{
          position: "sticky",
          top: 0,
          padding: isStuck ? "8px 24px" : "16px 24px",
          background: isStuck
            ? "rgba(255,255,255,0.95)"
            : "#fff",
          boxShadow: isStuck
            ? "0 2px 8px rgba(0,0,0,0.1)"
            : "none",
          transition: "all 0.2s",
          zIndex: 40,
        }}
      >
        <h1 style={{ margin: 0, fontSize: isStuck ? 18 : 24 }}>
          My App
        </h1>
      </header>
      <main style={{ padding: 24 }}>
        {Array.from({ length: 80 }, (_, i) => (
          <p key={i}>Content paragraph {i + 1}</p>
        ))}
      </main>
    </div>
  );
}
```

No sentinel elements. No manual observer setup. The hook does the detection internally and gives you a single reactive boolean to drive your styles.

## 5. Revealing Elements on Scroll

### The Manual Way

Fade-in-on-scroll effects are everywhere. The standard approach is to set up an `IntersectionObserver` for each animated element:

```tsx
import { useEffect, useRef, useState } from "react";

function ManualReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el); // only animate once
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(30px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      {children}
    </div>
  );
}
```

Copy-pasting this observer logic into every component that needs a reveal animation quickly becomes tedious.

### With useElementVisibility

[`useElementVisibility`](https://reactuse.com/element/useelementvisibility/) wraps `IntersectionObserver` into a single boolean return value. Pair it with a `useState` flag to create one-time reveal effects:

```tsx
import { useElementVisibility } from "@reactuses/core";
import { useRef, useState, useEffect } from "react";

function RevealOnScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible] = useElementVisibility(ref);
  const [hasRevealed, setHasRevealed] = useState(false);

  useEffect(() => {
    if (visible && !hasRevealed) {
      setHasRevealed(true);
    }
  }, [visible, hasRevealed]);

  return (
    <div
      ref={ref}
      style={{
        opacity: hasRevealed ? 1 : 0,
        transform: hasRevealed ? "translateY(0)" : "translateY(30px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      {children}
    </div>
  );
}

function FeaturePage() {
  return (
    <div style={{ padding: "100vh 24px 24px" }}>
      <RevealOnScroll>
        <h2>Feature One</h2>
        <p>This fades in when scrolled into view.</p>
      </RevealOnScroll>
      <div style={{ height: 200 }} />
      <RevealOnScroll>
        <h2>Feature Two</h2>
        <p>Each section animates independently.</p>
      </RevealOnScroll>
      <div style={{ height: 200 }} />
      <RevealOnScroll>
        <h2>Feature Three</h2>
        <p>And they only animate once -- no flickering on scroll back.</p>
      </RevealOnScroll>
    </div>
  );
}
```

`useElementVisibility` gives you the live visibility state. The `hasRevealed` flag ensures the animation only fires once. For repeating animations, simply drop the flag and drive the style directly from `visible`.

## 6. Advanced Intersection: Scroll-Linked Progress

### The Manual Way

For more advanced scroll effects -- like a progress indicator that fills as you scroll through a specific section -- you need fine-grained intersection ratios:

```tsx
import { useEffect, useRef, useState } from "react";

function ManualSectionProgress() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);
    const observer = new IntersectionObserver(
      ([entry]) => setRatio(entry.intersectionRatio),
      { threshold: thresholds }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <div style={{ height: "100vh" }} />
      <div ref={sectionRef} style={{ minHeight: "100vh", padding: 40 }}>
        <div
          style={{
            position: "sticky",
            top: 20,
            width: 200,
            height: 8,
            background: "#e2e8f0",
            borderRadius: 4,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${ratio * 100}%`,
              background: "#4f46e5",
              borderRadius: 4,
              transition: "width 0.1s",
            }}
          />
        </div>
        <h2>Long Section</h2>
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i}>Paragraph {i + 1} of the section.</p>
        ))}
      </div>
      <div style={{ height: "100vh" }} />
    </div>
  );
}
```

Building 101 threshold steps and managing the observer manually is verbose. And if you want multiple observers with different root margins or targets, the boilerplate multiplies.

### With useIntersectionObserver

[`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/) exposes the full `IntersectionObserver` API in a declarative way. You get the `IntersectionObserverEntry` directly, including `intersectionRatio`, `isIntersecting`, and `boundingClientRect`.

```tsx
import { useIntersectionObserver } from "@reactuses/core";
import { useRef, useState } from "react";

function SectionProgress() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(0);

  useIntersectionObserver(
    sectionRef,
    ([entry]) => {
      setRatio(entry.intersectionRatio);
    },
    {
      threshold: Array.from({ length: 101 }, (_, i) => i / 100),
    }
  );

  return (
    <div>
      <div style={{ height: "100vh" }} />
      <div ref={sectionRef} style={{ minHeight: "100vh", padding: 40 }}>
        <div
          style={{
            position: "sticky",
            top: 20,
            width: 200,
            height: 8,
            background: "#e2e8f0",
            borderRadius: 4,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${ratio * 100}%`,
              background: "#4f46e5",
              borderRadius: 4,
              transition: "width 0.1s",
            }}
          />
        </div>
        <h2>Long Section</h2>
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i}>Paragraph {i + 1} of the section.</p>
        ))}
      </div>
      <div style={{ height: "100vh" }} />
    </div>
  );
}
```

The hook manages the observer lifecycle, reconnects when options change, and cleans up on unmount. You focus on what to do with the intersection data, not how to wire the observer.

## Putting It All Together

These hooks compose naturally. Here is a landing page skeleton that combines all six:

```tsx
import {
  useScroll,
  useScrollLock,
  useScrollIntoView,
} from "@reactuses/core";
import { useSticky, useElementVisibility } from "@reactuses/core";
import { useRef, useState } from "react";

function LandingPage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Track scroll for progress bar
  const [position] = useScroll(scrollContainerRef);

  // Sticky header detection
  const [isStuck] = useSticky(headerRef);

  // Smooth scroll to pricing
  const { scrollIntoView } = useScrollIntoView(pricingRef, {
    offset: 64,
  });

  // Modal with scroll lock
  const [modalOpen, setModalOpen] = useState(false);
  useScrollLock(
    typeof document !== "undefined" ? document.body : null,
    modalOpen
  );

  // Reveal pricing section
  const [pricingVisible] = useElementVisibility(pricingRef);

  const el = scrollContainerRef.current;
  const progress = el
    ? position.y / (el.scrollHeight - el.clientHeight)
    : 0;

  return (
    <div ref={scrollContainerRef} style={{ height: "100vh", overflow: "auto" }}>
      {/* Progress bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 3,
          width: `${Math.min(progress * 100, 100)}%`,
          background: "#4f46e5",
          zIndex: 60,
        }}
      />

      {/* Sticky header */}
      <header
        ref={headerRef}
        style={{
          position: "sticky",
          top: 0,
          padding: isStuck ? "8px 24px" : "16px 24px",
          background: "#fff",
          boxShadow: isStuck ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
          transition: "all 0.2s",
          zIndex: 50,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 700 }}>MyApp</span>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => scrollIntoView()}>Pricing</button>
          <button onClick={() => setModalOpen(true)}>Contact</button>
        </div>
      </header>

      {/* Hero */}
      <section style={{ height: "100vh", padding: 40 }}>
        <h1>Build amazing products</h1>
      </section>

      {/* Pricing with reveal */}
      <section
        ref={pricingRef}
        style={{
          padding: 40,
          opacity: pricingVisible ? 1 : 0,
          transform: pricingVisible ? "none" : "translateY(30px)",
          transition: "all 0.6s ease",
        }}
      >
        <h2>Pricing</h2>
        <p>Plans and details here.</p>
      </section>

      <div style={{ height: "100vh" }} />

      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              maxWidth: 400,
            }}
          >
            <h2>Contact Us</h2>
            <p>Page scroll is locked while this modal is open.</p>
            <button onClick={() => setModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

Each hook handles one responsibility. They share refs naturally, do not conflict with each other, and all clean up automatically on unmount.

## Installation

```bash
npm i @reactuses/core
```

## Related Hooks

- [`useScroll`](https://reactuse.com/browser/usescroll/) -- Track scroll position, direction, and edge arrival
- [`useScrollLock`](https://reactuse.com/browser/usescrolllock/) -- Lock scroll on any element
- [`useScrollIntoView`](https://reactuse.com/browser/usescrollintoview/) -- Smooth scroll to a target element with offset and easing
- [`useSticky`](https://reactuse.com/element/usesticky/) -- Detect when an element enters its sticky state
- [`useElementVisibility`](https://reactuse.com/element/useelementvisibility/) -- Check if an element is visible in the viewport
- [`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/) -- Full-featured intersection observation
- [`useEventListener`](https://reactuse.com/effect/useeventlistener/) -- Attach event listeners declaratively
- [`useElementSize`](https://reactuse.com/element/useelementsize/) -- Track element dimensions reactively
- [`useElementBounding`](https://reactuse.com/element/useelementbounding/) -- Get live bounding rectangle of an element

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
