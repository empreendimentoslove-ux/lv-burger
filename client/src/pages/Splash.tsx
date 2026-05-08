import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Splash() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading, user } = useAuth();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "motoboy") {
        navigate("/motoboy");
      } else {
        navigate("/home");
      }
    }
  }, [isAuthenticated, loading, user, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-between px-6 py-12">
      {/* Logo area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div
          className={`transition-all duration-700 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-28 h-28 rounded-full bg-[#c0392b] flex items-center justify-center shadow-2xl lv-shadow">
              <span className="font-display text-white text-5xl font-black tracking-tight">LV</span>
            </div>
            <div className="text-center">
              <h1 className="font-display text-white text-4xl font-bold tracking-widest">BURGER</h1>
              <div className="flex items-center gap-2 mt-1 justify-center">
                <div className="h-px w-8 bg-[#d4af37]" />
                <span className="text-[#d4af37] text-xs tracking-[0.3em] uppercase font-medium">
                  Artesanal & Premium
                </span>
                <div className="h-px w-8 bg-[#d4af37]" />
              </div>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <p
          className={`text-[#888] text-center text-sm leading-relaxed max-w-xs transition-all duration-700 delay-200 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Hambúrgueres artesanais feitos com ingredientes selecionados, entregues na sua porta.
        </p>
      </div>

      {/* CTA */}
      <div
        className={`w-full max-w-sm flex flex-col gap-3 transition-all duration-700 delay-400 ${
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-8 h-8 border-2 border-[#c0392b] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <a
              href={getLoginUrl()}
              className="w-full bg-[#c0392b] text-white text-center py-4 rounded-2xl font-semibold text-base tracking-wide active:scale-95 transition-transform lv-shadow"
            >
              Entrar com Manus
            </a>
            <p className="text-center text-[#555] text-xs">
              Ao continuar, você concorda com nossos termos de uso
            </p>
          </>
        )}
      </div>
    </div>
  );
}
