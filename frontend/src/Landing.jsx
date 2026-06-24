import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { API_BASE } from "./lib/api";

const STAGES = [
  {
    title: "Learn just enough.",
    description: "Pick up only the core skills your pathway actually needs to get moving, skipping the rest for now.",
  },
  {
    title: "Start a practical project.",
    description: "Apply those core skills immediately on a real project instead of waiting until you feel ready.",
  },
  {
    title: "Deepen later.",
    description: "Come back to strengthen your foundations once you have something real already built.",
  },
  {
    title: "Optional structured tracks.",
    description: "Go further with curated deeper courses, kept separate from the core path so they never block your progress.",
  },
];

const PATHWAYS = [
  "Data Analyst",
  "Data Scientist",
  "Data Engineer",
  "Machine Learning Engineer",
  "Software Developer",
];

const SOURCES = [
  "Coursera",
  "DataCamp",
  "edX",
  "Udacity",
  "Udemy",
  "freeCodeCamp",
  "Khan Academy",
  "Kaggle Learn",
  "Google Cloud",
  "IBM SkillsBuild",
  "University Open Course",
  "YouTube",
  "3Blue1Brown",
  "StatQuest",
  "Storytelling with Data",
  "Computerphile",
  "Fireship",
  "Atlassian",
];

const FEATURES = [
  {
    title: "Dynamic staged paths",
    description: "Your path restages itself as skills and completed modules change, instead of staying fixed.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l9 5-9 5-9-5 9-5z" />
        <path d="M3 13l9 5 9-5" />
      </svg>
    ),
  },
  {
    title: "Skill gaps, not guesswork",
    description: "Recommendations track exactly which skills you're missing for your target pathway, and close them in order.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      </svg>
    ),
  },
  {
    title: "Optional structured tracks",
    description: "Go deeper with curated courses kept separate from your core path, so they never block your progress.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 4v9a3 3 0 003 3h8" />
        <path d="M13 13l3 3-3 3" />
      </svg>
    ),
  },
];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useLenis() {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);
}

function useHeroParallax() {
  const heroRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    let ticking = false;
    function computeProgress() {
      const node = heroRef.current;
      if (node) {
        const height = node.offsetHeight || window.innerHeight;
        setProgress(Math.min(1, Math.max(0, window.scrollY / (height * 0.8))));
      }
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(computeProgress);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return [heroRef, progress];
}

function useVideoAutoPause(containerRef) {
  useEffect(() => {
    const container = containerRef.current;
    const video = container?.querySelector("video");
    if (!container || !video) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.1 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);
}

function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setIsVisible(true);
      return undefined;
    }
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4, ...options }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

function RevealLine({ as: Tag = "p", className = "", children }) {
  const [ref, isVisible] = useScrollReveal();
  return (
    <Tag ref={ref} className={`reveal-line ${isVisible ? "is-visible" : ""} ${className}`}>
      {children}
    </Tag>
  );
}

function OrbitRings({ size = 560 }) {
  return (
    <svg className="orbit-rings" viewBox="0 0 600 600" width={size} height={size} aria-hidden="true">
      <circle cx="300" cy="300" r="280" />
      <circle cx="300" cy="300" r="200" />
      <circle cx="300" cy="300" r="120" />
    </svg>
  );
}

function useDatasetStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const response = await fetch(`${API_BASE}/api/research/dataset-summary`);
        if (!response.ok) throw new Error("stats unavailable");
        const data = await response.json();
        if (!cancelled) setStats(data);
      } catch {
        // stays null; stats strip renders "—" placeholders
      }
    }
    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  return stats;
}

export default function Landing({ onStart }) {
  useLenis();
  const stats = useDatasetStats();
  const [heroRef, heroProgress] = useHeroParallax();
  useVideoAutoPause(heroRef);

  function scrollToShowcase() {
    document.querySelector(".landing-showcase")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="landing">
      <nav className="landing-nav">
        <span className="landing-nav-wordmark">Career-Aware Learning</span>
        <button className="primary landing-nav-cta" onClick={onStart}>Start Learning</button>
      </nav>

      <header className="landing-hero" ref={heroRef}>
        <video
          className="landing-hero-video"
          src="/landing-page-video.mp4"
          poster="/landing-hero.jpg"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="hero-scrim" aria-hidden="true" />
        <div className="hero-bottom-fade" aria-hidden="true" />
        <div
          className="landing-hero-copy"
          style={{
            opacity: Math.max(0, 1 - heroProgress * 1.4),
            transform: `translateY(${heroProgress * -40}px)`,
          }}
        >
          <h1>
            Learn just enough.
            <br />
            Build early.
            <br />
            Deepen later.
          </h1>
          <p>Start with the skills that matter, then grow your pathway through practical progress.</p>
          <button className="primary" onClick={onStart}>Start Learning</button>
        </div>
        <button
          type="button"
          className="hero-scroll-cue"
          aria-label="Scroll to see the product"
          style={{ opacity: Math.max(0, 1 - heroProgress * 4) }}
          onClick={scrollToShowcase}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </button>
      </header>

      <section className="landing-section landing-showcase">
        <RevealLine as="h2" className="showcase-heading">See it running.</RevealLine>
        <div className="showcase-grid">
          <RevealLine as="figure" className="showcase-frame">
            <img src="/screenshot-dashboard.png" alt="Dashboard view showing a staged learning path with progress and skill gaps" />
            <figcaption>Your generated course, staged from core skills to deeper practice.</figcaption>
          </RevealLine>
          <RevealLine as="figure" className="showcase-frame">
            <img src="/screenshot-research.png" alt="Research view showing model metrics, an NDCG comparison chart, and dataset summary" />
            <figcaption>The research view: model metrics, NDCG comparison, and why each resource was picked.</figcaption>
          </RevealLine>
        </div>
      </section>

      <section className="landing-section landing-stages">
        {STAGES.map((stage, index) => (
          <RevealLine key={stage.title} className="stage-line">
            <span className="stage-title-row">
              <span className="stage-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="stage-title">{stage.title}</span>
            </span>
            <span className="stage-description">{stage.description}</span>
          </RevealLine>
        ))}
      </section>

      <section className="landing-section landing-about">
        <div className="about-content">
          <RevealLine as="h2" className="about-heading">A recommender, not a course catalogue.</RevealLine>
          <RevealLine as="p" className="about-copy">
            A career-pathway learning recommender that turns a skill check into a staged, real course. Tell it
            which pathway you're aiming for and what you already know, and it builds a path that starts with
            only the core skills you need, gets you into a practical project fast, and leaves deeper theory
            for after you've built something real.
          </RevealLine>
          <RevealLine as="div" className="stats-strip">
            <div className="stat">
              <strong>{stats ? stats.learning_resources : "—"}</strong>
              <span>Learning resources</span>
            </div>
            <div className="stat">
              <strong>{stats ? stats.pathways : "—"}</strong>
              <span>Career pathways</span>
            </div>
            <div className="stat">
              <strong>{stats ? stats.skills : "—"}</strong>
              <span>Tracked skills</span>
            </div>
          </RevealLine>
        </div>
        <RevealLine as="div" className="about-figure">
          <img src="/about-statue.webp" alt="Classical marble statue working on a laptop, lit warmly against a dark background" />
        </RevealLine>
      </section>

      <section className="landing-section landing-sources">
        <RevealLine as="h2" className="sources-heading">Pulled from trusted platforms.</RevealLine>
        <RevealLine as="p" className="sources-copy">
          Every resource links back to its original provider, no generated content, no fabricated courses.
        </RevealLine>
        <div className="marquee">
          <div className="marquee-track">
            {SOURCES.map((source) => (
              <span key={source} className="pill source-pill">{source}</span>
            ))}
            {SOURCES.map((source) => (
              <span key={`${source}-dup`} className="pill source-pill" aria-hidden="true">{source}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-pathways">
        <OrbitRings size={420} />
        <div className="pathway-tag-grid">
          {PATHWAYS.map((pathway) => (
            <RevealLine key={pathway} as="span" className="pill pathway-tag">
              {pathway}
            </RevealLine>
          ))}
        </div>
      </section>

      <section className="landing-section landing-features">
        <RevealLine as="h2" className="features-heading">Built around how you actually learn.</RevealLine>
        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <RevealLine key={feature.title} as="article" className="feature-card">
              <span className="feature-mark">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </RevealLine>
          ))}
        </div>
      </section>

      <section className="landing-section landing-closing">
        <RevealLine as="h2" className="closing-line">
          Ready to start <span className="accent">your pathway</span>?
        </RevealLine>
        <RevealLine as="p" className="closing-copy">
          Pick a pathway, take a quick skill check, and get a staged course built around what you already know.
        </RevealLine>
        <button className="primary closing-cta" onClick={onStart}>
          Start Learning
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </section>
    </div>
  );
}
