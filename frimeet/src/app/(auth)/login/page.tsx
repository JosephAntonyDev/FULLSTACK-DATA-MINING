import Image from "next/image";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata = {
  title: "Iniciar sesión · Frimeet",
  description: "Conecta con personas y descubre experiencias sociales únicas.",
};

export default function LoginPage() {
  return (
    <main className="login-page">
      {/* ── Fondo naranja superior ── */}
      <div className="login-bg-orange" aria-hidden="true" />

      {/* ── Fondo blanco inferior ── */}
      <div className="login-bg-white" aria-hidden="true" />

      {/* ── Mancha verde inferior-derecha ── */}
      <div className="login-green-blob" aria-hidden="true" />

      {/* ── Logo FRIMEET centrado arriba ── */}
      <div className="login-logo-wrapper">
        <Image
          src="/images/Frimeet_banner.png"
          alt="Frimeet"
          width={220}
          height={66}
          priority
          style={{ width: "auto", height: "auto" }}
          className="login-logo"
        />
      </div>

      {/* ── Imagen izquierda (1.png) ── */}
      <div className="login-img login-img--left" aria-hidden="true">
        <Image
          src="/images/1.png"
          alt=""
          fill
          sizes="(min-width: 1280px) 480px, 420px"
          priority
          className="object-contain object-bottom"
        />
      </div>

      {/* ── Imagen superior-derecha (3.png — mano sosteniendo teléfono desde arriba) ── */}
      <div className="login-img login-img--top-right" aria-hidden="true">
        <Image
          src="/images/3.png"
          alt=""
          fill
          sizes="(min-width: 1280px) 340px, 280px"
          priority
          className="object-contain"
        />
      </div>

      {/* ── Imagen inferior-derecha (2.png — persona con café/teléfono) ── */}
      <div className="login-img login-img--bottom-right" aria-hidden="true">
        <Image
          src="/images/2.png"
          alt=""
          fill
          sizes="(min-width: 1280px) 380px, 320px"
          className="object-contain object-bottom"
        />
      </div>

      {/* ── Card del formulario ── */}
      <div className="login-card">
        <LoginForm />
      </div>
    </main>
  );
}
