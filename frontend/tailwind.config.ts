import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#d4d4d4',
          300: '#b5b5b5',
          400: '#949494',
          500: '#737373',
          600: '#575757',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        zinc: {
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#d4d4d4',
          300: '#b5b5b5',
          400: '#949494',
          500: '#737373',
          600: '#575757',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        slate: {
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#d4d4d4',
          300: '#b5b5b5',
          400: '#949494',
          500: '#737373',
          600: '#575757',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        bg: "#07060a",
        surface: "#100e16",
        "surface-2": "#17141f",
        line: "rgba(255,255,255,0.08)",
        accent: {
          DEFAULT: "#8b5cf6",
          soft: "#a78bfa",
          deep: "#6d28d9",
        },
        magenta: "#e94ea1",
        ink: {
          DEFAULT: "#f4f2f8",
          muted: "#a19cb0",
          faint: "#6b6779",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(60% 50% at 12% 8%, rgba(109,40,217,0.28) 0%, rgba(109,40,217,0) 60%), radial-gradient(40% 35% at 85% 25%, rgba(139,92,246,0.10) 0%, rgba(139,92,246,0) 55%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(139,92,246,0.25), 0 8px 40px -8px rgba(139,92,246,0.45)",
      },
      keyframes: {
        buttonAura: {
          "0%, 100%": { transform: "scale(0.96)", opacity: "0.16" },
          "50%": { transform: "scale(1.04)", opacity: "0.3" },
        },
        buttonParticleFour: {
          "0%, 100%": { transform: "translate(0, 4px) scale(0.2)", opacity: "0" },
          "25%": { opacity: "0.8" },
          "78%": { transform: "translate(-9px, -12px) scale(0.9)", opacity: "0" },
        },
        buttonParticleFive: {
          "0%, 100%": { transform: "translate(0, -4px) scale(0.2)", opacity: "0" },
          "22%": { opacity: "0.75" },
          "76%": { transform: "translate(10px, 12px) scale(0.9)", opacity: "0" },
        },
        buttonParticleOne: {
          "0%, 100%": { transform: "translate(0, 2px) scale(0.5)", opacity: "0" },
          "25%": { opacity: "0.9" },
          "70%": { transform: "translate(-7px, -8px) scale(1)", opacity: "0.35" },
        },
        buttonParticleTwo: {
          "0%, 100%": { transform: "translate(0, 0) scale(0.5)", opacity: "0" },
          "35%": { opacity: "0.8" },
          "75%": { transform: "translate(7px, -7px) scale(1.1)", opacity: "0.2" },
        },
        buttonParticleThree: {
          "0%, 100%": { transform: "translate(0, 0) scale(0.5)", opacity: "0" },
          "30%": { opacity: "0.8" },
          "75%": { transform: "translate(8px, 7px) scale(1)", opacity: "0.2" },
        },
        sparkleBreathe: {
          "0%, 100%": { transform: "translate(-50%, -50%) rotate(45deg) scale(0.82)", opacity: "0.72" },
          "50%": { transform: "translate(-50%, -50%) rotate(45deg) scale(1.12)", opacity: "1" },
        },
        sparkleOrbit: {
          "0%, 100%": { transform: "translate(0) rotate(45deg) scale(0.7)", opacity: "0.35" },
          "50%": { transform: "translate(2px, 2px) rotate(135deg) scale(1.15)", opacity: "1" },
        },
        sparkleTwinkle: {
          "0%, 100%": { transform: "rotate(45deg) scale(0.5)", opacity: "0.2" },
          "50%": { transform: "rotate(45deg) scale(1.25)", opacity: "0.9" },
        },
        sparklePop: {
          "0%": { opacity: "0.25", transform: "scale(0.72)" },
          "55%": { opacity: "1", transform: "scale(1.18)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        sparkleGlow: {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 0 rgba(255,255,255,0))" },
          "50%": { opacity: "1", filter: "drop-shadow(0 0 4px rgba(255,255,255,0.4))" },
        },
        dropZonePulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(139,92,246,0.18)" },
          "50%": { boxShadow: "0 0 0 8px rgba(139,92,246,0.03)" },
        },
        uploadOverlayIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        uploadModalIn: {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        uploadOverlayOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        uploadModalOut: {
          "0%": { opacity: "1", transform: "scale(1) translateY(0)" },
          "100%": { opacity: "0", transform: "scale(0.98) translateY(4px)" },
        },
        wordPop: {
          "0%": { color: "var(--tw-caption-idle, #a19cb0)", transform: "scale(1)" },
          "15%": { color: "#f4f2f8", transform: "scale(1.06)" },
          "35%": { color: "#f4f2f8", transform: "scale(1)" },
          "100%": { color: "#f4f2f8", transform: "scale(1)" },
        },
        waveform: {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
        floatSlow: {
          "0%, 100%": {
            transform:
              "translate3d(var(--tw-translate-x), var(--tw-translate-y), 0) rotate(calc(var(--tw-rotate) - 1deg)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))",
          },
          "50%": {
            transform:
              "translate3d(var(--tw-translate-x), calc(var(--tw-translate-y) - 10px), 0) rotate(calc(var(--tw-rotate) + 1deg)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))",
          },
        },
        phoneIdleFront: {
          "0%, 100%": {
            transform: "translate3d(0px, 0px, 0px) rotate(-8deg)",
          },
          "33%": {
            transform: "translate3d(5px, -18px, 0px) rotate(-6.8deg)",
          },
          "66%": {
            transform: "translate3d(-5px, -10px, 0px) rotate(-9.2deg)",
          },
        },
        phoneIdleBack: {
          "0%, 100%": {
            transform: "translate3d(0px, 0px, 0px) rotate(6deg)",
          },
          "33%": {
            transform: "translate3d(-6px, 16px, 0px) rotate(7.2deg)",
          },
          "66%": {
            transform: "translate3d(4px, 8px, 0px) rotate(4.8deg)",
          },
        },
        blobDrift: {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(20px,-15px) scale(1.06)" },
        },
        eqBar1: {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
        eqBar2: {
          "0%, 100%": { transform: "scaleY(0.85)" },
          "50%": { transform: "scaleY(0.2)" },
        },
        eqBar3: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(0.95)" },
        },
      },
      animation: {
        wordPop: "wordPop 0.6s ease forwards",
        waveform: "waveform 1.1s ease-in-out infinite",
        eq1: "eqBar1 0.85s ease-in-out infinite",
        eq2: "eqBar2 0.65s ease-in-out infinite",
        eq3: "eqBar3 0.75s ease-in-out infinite",
        floatSlow: "floatSlow 6s ease-in-out infinite",
        phoneIdleFront: "phoneIdleFront 8s ease-in-out infinite",
        phoneIdleBack: "phoneIdleBack 9.5s ease-in-out infinite",
        blobDrift: "blobDrift 14s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;