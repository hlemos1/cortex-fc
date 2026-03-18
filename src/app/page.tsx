"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Brain,
  Database,
  Target,
  Layers,
  GitCompareArrows,
  Search,
  Bot,
  FileText,
  Building2,
  ChevronRight,
  ArrowRight,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Check,
  Menu,
  X,
} from "lucide-react";

// ============================================
// Intersection Observer hook for scroll animations
// ============================================
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// ============================================
// Animated Section wrapper
// ============================================
function AnimatedSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, isInView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ============================================
// Hero visualization
// ============================================
const scatterDots = [
  { x: 22, y: 68, color: "#10b981", label: "CONTRATAR" },
  { x: 35, y: 25, color: "#10b981", label: "CONTRATAR" },
  { x: 75, y: 72, color: "#ef4444", label: "RECUSAR" },
  { x: 60, y: 55, color: "#f59e0b", label: "MONITORAR" },
  { x: 15, y: 40, color: "#10b981", label: "CONTRATAR" },
  { x: 82, y: 30, color: "#f59e0b", label: "MONITORAR" },
  { x: 45, y: 80, color: "#ef4444", label: "RECUSAR" },
  { x: 28, y: 15, color: "#10b981", label: "BLINDAR" },
  { x: 55, y: 42, color: "#f59e0b", label: "MONITORAR" },
  { x: 70, y: 85, color: "#ef4444", label: "RECUSAR" },
  { x: 40, y: 35, color: "#10b981", label: "CONTRATAR" },
  { x: 90, y: 60, color: "#ef4444", label: "RECUSAR" },
  { x: 18, y: 52, color: "#10b981", label: "CONTRATAR" },
  { x: 65, y: 20, color: "#f59e0b", label: "MONITORAR" },
];

// ============================================
// PAGE COMPONENT
// ============================================
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* ========================================
          NAVBAR
          ======================================== */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass-strong shadow-lg shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Brain className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              CORTEX <span className="text-emerald-400">FC</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#como-funciona"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Como Funciona
            </a>
            <a
              href="#modulos"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Módulos
            </a>
            <a
              href="#planos"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Planos
            </a>
            <a
              href="#contato"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Contato
            </a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-zinc-400 hover:text-white px-4 py-2 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2 rounded-lg transition-colors"
            >
              Começar
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-zinc-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-strong border-t border-white/5 px-6 py-6 space-y-4 animate-slide-down">
            <a href="#como-funciona" className="block text-sm text-zinc-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              Como Funciona
            </a>
            <a href="#modulos" className="block text-sm text-zinc-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              Módulos
            </a>
            <a href="#planos" className="block text-sm text-zinc-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              Planos
            </a>
            <a href="#contato" className="block text-sm text-zinc-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              Contato
            </a>
            <div className="pt-4 border-t border-white/5 flex gap-3">
              <Link href="/login" className="text-sm text-zinc-400 hover:text-white px-4 py-2">
                Entrar
              </Link>
              <Link href="/register" className="text-sm font-medium bg-emerald-500 text-black px-5 py-2 rounded-lg">
                Começar
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ========================================
          HERO SECTION
          ======================================== */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-emerald-400 mb-8">
                <Zap className="h-3 w-3" />
                <span>Plataforma Neural de Análise de Futebol</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
                Inteligência Neural para{" "}
                <span className="gradient-text">Decisões de Futebol</span>
              </h1>

              <p className="text-lg md:text-xl text-zinc-400 leading-relaxed mb-10 max-w-xl">
                O sistema de análise que combina 7 camadas neurais, algoritmos
                proprietários e IA para transformar dados em decisões de mercado.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-7 py-3.5 rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                >
                  Começar Agora
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-medium px-7 py-3.5 rounded-lg transition-all"
                >
                  Ver Demo
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <div className="flex -space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-7 w-7 rounded-full bg-zinc-800 border-2 border-[#09090b] flex items-center justify-center"
                    >
                      <Shield className="h-3 w-3 text-zinc-500" />
                    </div>
                  ))}
                </div>
                <span className="text-zinc-500">
                  Projetado para clubes profissionais de elite
                </span>
              </div>
            </div>

            {/* Right: VxRx Mockup */}
            <div className="animate-fade-in stagger-2 relative">
              <div className="glass-strong rounded-2xl p-6 relative overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">
                      Matriz VxRx
                    </p>
                    <p className="text-sm font-medium text-zinc-300">
                      Análise em Tempo Real
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-400">Live</span>
                  </div>
                </div>

                {/* Scatter plot area */}
                <div className="relative h-64 md:h-72 bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden">
                  {/* Grid lines */}
                  <div className="absolute inset-0">
                    {[25, 50, 75].map((p) => (
                      <div
                        key={`h-${p}`}
                        className="absolute left-0 right-0 border-t border-zinc-800/40"
                        style={{ top: `${p}%` }}
                      />
                    ))}
                    {[25, 50, 75].map((p) => (
                      <div
                        key={`v-${p}`}
                        className="absolute top-0 bottom-0 border-l border-zinc-800/40"
                        style={{ left: `${p}%` }}
                      />
                    ))}
                  </div>

                  {/* Quadrant labels */}
                  <span className="absolute top-2 left-3 text-xs text-emerald-500/60 font-mono">
                    CONTRATAR
                  </span>
                  <span className="absolute top-2 right-3 text-xs text-red-500/60 font-mono">
                    RECUSAR
                  </span>
                  <span className="absolute bottom-2 left-3 text-xs text-emerald-500/40 font-mono">
                    BLINDAR
                  </span>
                  <span className="absolute bottom-2 right-3 text-xs text-amber-500/60 font-mono">
                    MONITORAR
                  </span>

                  {/* Axis labels */}
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-zinc-500 font-mono">
                    Rx (Risco) →
                  </span>
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-zinc-500 font-mono">
                    Vx (Valor) →
                  </span>

                  {/* Dots */}
                  {scatterDots.map((dot, i) => (
                    <div
                      key={i}
                      className="absolute h-2.5 w-2.5 rounded-full transition-all duration-1000 animate-fade-in"
                      style={{
                        left: `${dot.x}%`,
                        bottom: `${dot.y}%`,
                        backgroundColor: dot.color,
                        boxShadow: `0 0 8px ${dot.color}40`,
                        animationDelay: `${i * 120}ms`,
                      }}
                    />
                  ))}
                </div>

                {/* Bottom stats */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "Analisados", value: "14", color: "text-zinc-300" },
                    { label: "Contratar", value: "5", color: "text-emerald-400" },
                    { label: "Recusar", value: "4", color: "text-red-400" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-zinc-900/50 rounded-lg p-3 text-center"
                    >
                      <p className={`text-lg font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                      <p className="text-xs text-zinc-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Glow effect */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              </div>

              {/* Floating card */}
              <div className="absolute -bottom-4 -left-4 glass rounded-xl p-3 animate-float shadow-xl shadow-black/40">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">SCN+ 87.3</p>
                    <p className="text-xs text-emerald-400">CONTRATAR</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          METRICS BAR
          ======================================== */}
      <AnimatedSection>
        <section className="py-6">
          <div className="mx-auto max-w-5xl px-6">
            <div className="glass-strong rounded-2xl py-8 px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "50+", label: "Variáveis por Jogador", icon: Users },
                { value: "100%", label: "Decisões Baseadas em Dados", icon: Target },
                { value: "7", label: "Camadas Neurais", icon: Layers },
                { value: "6", label: "Agentes de IA", icon: Bot },
              ].map((metric) => (
                <div key={metric.label} className="text-center">
                  <div className="flex justify-center mb-2">
                    <metric.icon className="h-5 w-5 text-emerald-500/60" />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold gradient-text">
                    {metric.value}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ========================================
          HOW IT WORKS
          ======================================== */}
      <section id="como-funciona" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <AnimatedSection className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-emerald-500 mb-3">
              Processo
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Como Funciona
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Da coleta de dados à decisão final em três etapas integradas
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0" />

            {[
              {
                step: "01",
                icon: Database,
                title: "Coleta de Dados",
                desc: "Integramos dados de performance, mercado, comportamento e contexto tático de múltiplas fontes.",
              },
              {
                step: "02",
                icon: Brain,
                title: "Análise Neural",
                desc: "7 camadas neurais processam 50+ variáveis em tempo real com algoritmos proprietários.",
              },
              {
                step: "03",
                icon: Target,
                title: "Decisão Inteligente",
                desc: "Score VxRx + decisão automatizada: CONTRATAR, BLINDAR, MONITORAR ou RECUSAR.",
              },
            ].map((item, i) => (
              <AnimatedSection key={item.step}>
                <div
                  className={`glass rounded-2xl p-8 card-hover text-center relative stagger-${
                    i + 1
                  }`}
                >
                  {/* Step number */}
                  <div className="mx-auto mb-6 h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative z-10">
                    <item.icon className="h-6 w-6 text-emerald-400" />
                  </div>
                  <p className="text-xs uppercase tracking-widest text-emerald-500/60 mb-2 font-mono">
                    Etapa {item.step}
                  </p>
                  <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          FEATURES — Módulos do Sistema
          ======================================== */}
      <section
        id="modulos"
        className="py-24 bg-gradient-to-b from-transparent via-zinc-950/50 to-transparent"
      >
        <div className="mx-auto max-w-7xl px-6">
          <AnimatedSection className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-emerald-500 mb-3">
              Funcionalidades
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Módulos do Sistema
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Uma suite completa de ferramentas de inteligência para gestão de
              futebol profissional
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Layers,
                title: "Análise Neural 7 Camadas",
                desc: "C1 Técnico, C2 Tático, C3 Físico, C4 Comportamental, C5 Narrativa, C6 Econômico e C7 IA — cada camada refina a precisão.",
              },
              {
                icon: GitCompareArrows,
                title: "Matriz VxRx",
                desc: "Valor vs Risco em tempo real. Visualize todos os alvos num scatter plot interativo com decisões automáticas.",
              },
              {
                icon: Search,
                title: "Scouting Intelligence",
                desc: "Pipeline completo de alvos com filtros por posição, idade, estilo de jogo, orçamento e fit tático.",
              },
              {
                icon: Bot,
                title: "6 Agentes de IA",
                desc: "ORACLE, SCOUT, ANALISTA, CFO, BOARD e COACHING — agentes especializados que colaboram para a melhor decisão.",
              },
              {
                icon: FileText,
                title: "Relatórios Executivos",
                desc: "PDF com parecer neural completo, pronto para apresentação ao board. Inclui análise financeira e recomendações.",
              },
              {
                icon: Building2,
                title: "Multi-Club Holding",
                desc: "Gestão centralizada de múltiplos clubes com benchmarking cruzado, sinergias e transferências internas.",
              },
            ].map((feature, i) => (
              <AnimatedSection key={feature.title}>
                <div className="glass rounded-2xl p-7 card-hover group h-full">
                  <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:bg-emerald-500/15 transition-colors">
                    <feature.icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-semibold mb-2.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          SOCIAL PROOF
          ======================================== */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <AnimatedSection className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-emerald-500 mb-3">
              Depoimentos
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O que dizem
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Profissionais do futebol que transformaram suas decisões com o
              Cortex FC
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "O sistema neural identificou padrões que nossa equipe de scouting levaria meses para detectar.",
                role: "Diretor Desportivo",
                club: "Clube da Serie A",
              },
              {
                quote:
                  "A produtividade do departamento de scouting aumentou significativamente com a análise automatizada.",
                role: "Chefe de Scouting",
                club: "Clube Europeu",
              },
              {
                quote:
                  "O módulo CFO trouxe uma nova perspectiva para nossa modelagem financeira de transferências.",
                role: "CFO",
                club: "Grupo Multi-Club",
              },
            ].map((testimonial, i) => (
              <AnimatedSection key={testimonial.role}>
                <div className="glass rounded-2xl p-7 card-hover h-full flex flex-col">
                  <p className="text-sm text-zinc-300 leading-relaxed mb-6 flex-grow">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-5 border-t border-white/5">
                    <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-emerald-400">
                      {testimonial.role[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{testimonial.role}</p>
                      <p className="text-xs text-zinc-500">
                        {testimonial.club}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
          <p className="text-xs text-zinc-500 text-center mt-6">
            Depoimentos baseados em feedback de usuários beta
          </p>
        </div>
      </section>

      {/* ========================================
          PRICING
          ======================================== */}
      <section
        id="planos"
        className="py-24 bg-gradient-to-b from-transparent via-zinc-950/50 to-transparent"
      >
        <div className="mx-auto max-w-7xl px-6">
          <AnimatedSection className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-emerald-500 mb-3">
              Investimento
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Escolha o plano ideal para o seu nível de operação
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: "Free",
                price: "0",
                period: "",
                badge: null,
                features: [
                  "5 análises por mês",
                  "1 agente (ORACLE)",
                  "3 algoritmos (SCN+, AST, CLF)",
                  "5 alvos de scouting",
                  "1 relatório por mês",
                ],
                cta: "Começar Grátis",
                href: "/register",
                featured: false,
              },
              {
                name: "Scout Individual",
                price: "49",
                period: "/mês",
                badge: null,
                features: [
                  "50 análises por mês",
                  "2 agentes (ORACLE + SCOUT)",
                  "3 algoritmos proprietários",
                  "25 alvos de scouting",
                  "10 relatórios por mês",
                  "Export CSV",
                ],
                cta: "Iniciar Trial",
                href: "/register",
                featured: false,
              },
              {
                name: "Club Professional",
                price: "299",
                period: "/mês",
                badge: "POPULAR",
                features: [
                  "Análises ilimitadas",
                  "7 algoritmos proprietários",
                  "6 agentes de IA completos",
                  "Scouting ilimitado",
                  "Export PDF + CSV",
                  "API access",
                  "Suporte prioritário",
                ],
                cta: "Iniciar Trial",
                href: "/register",
                featured: true,
              },
              {
                name: "Holding Multi-Club",
                price: null,
                period: "",
                badge: null,
                features: [
                  "Tudo do Professional",
                  "Gestão multi-clube",
                  "Benchmarking cruzado",
                  "White-label disponível",
                  "SSO / SAML",
                  "Export XLSX + PDF + CSV",
                  "SLA dedicado",
                ],
                cta: "Falar com Vendas",
                href: "/register",
                featured: false,
              },
            ].map((plan) => (
              <AnimatedSection key={plan.name}>
                <div
                  className={`rounded-2xl p-7 card-hover h-full flex flex-col relative ${
                    plan.featured
                      ? "glass-strong border border-emerald-500/30 shadow-lg shadow-emerald-500/5"
                      : "glass"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-base font-semibold mb-4">
                      {plan.name}
                    </h3>
                    {plan.price !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-zinc-500">€</span>
                        <span className="text-4xl font-bold">{plan.price}</span>
                        {plan.period && (
                          <span className="text-sm text-zinc-500">
                            {plan.period}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-zinc-300">Sob consulta</p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm text-zinc-300"
                      >
                        <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.href}
                    className={`w-full text-center py-3 rounded-lg text-sm font-medium transition-all block ${
                      plan.featured
                        ? "bg-emerald-500 hover:bg-emerald-400 text-black hover:shadow-lg hover:shadow-emerald-500/20"
                        : "border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          CTA FINAL
          ======================================== */}
      <section id="contato" className="py-24">
        <div className="mx-auto max-w-3xl px-6">
          <AnimatedSection>
            <div className="glass-strong rounded-2xl p-10 md:p-14 text-center relative overflow-hidden">
              {/* Glow */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Pronto para transformar suas decisões?
                </h2>
                <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
                  Solicite acesso à plataforma e comece a tomar decisões
                  baseadas em inteligência neural.
                </p>

                <div className="flex justify-center mb-5">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-3.5 rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20 text-sm"
                  >
                    Solicitar Acesso
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <p className="text-xs text-zinc-500">
                  Sem compromisso. Setup em 24h.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ========================================
          FOOTER
          ======================================== */}
      <footer className="border-t border-white/5 py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <Brain className="h-4.5 w-4.5 text-emerald-400" />
                </div>
                <span className="text-lg font-bold tracking-tight">
                  CORTEX <span className="text-emerald-400">FC</span>
                </span>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Inteligência neural para o futebol profissional.
              </p>
            </div>

            {/* Links */}
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-4 font-medium">
                Produto
              </p>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">
                    Módulos
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">
                    Preços
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-4 font-medium">
                Empresa
              </p>
              <ul className="space-y-2.5">
                <li>
                  <a href="mailto:contato@cortexfc.com" className="text-sm text-zinc-400 hover:text-white transition-colors">
                    Contato
                  </a>
                </li>
                <li>
                  <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
                    Login
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-4 font-medium">
                Legal
              </p>
              <ul className="space-y-2.5">
                <li>
                  <a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                    Termos de Uso
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                    Privacidade
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-500">
              &copy; 2026 Cortex FC. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                Termos de Uso
              </a>
              <a
                href="#"
                className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                Privacidade
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
