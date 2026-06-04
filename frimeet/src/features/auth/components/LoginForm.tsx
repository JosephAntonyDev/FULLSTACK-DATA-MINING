"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { loginSchema, LoginFormData } from "../schemas/loginSchema";
import { useLogin } from "../hooks/useLogin";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    mutate(data, {
      onSuccess: () => {
        console.log("Login success");
      },
    });
  };

  return (
    <div className="login-form-wrapper">
      {/* Encabezado */}
      <div className="login-form-header">
        <h1 className="login-form-title">Iniciar sesión</h1>
        <p className="login-form-subtitle">
          Bienvenido de nuevo, es bueno volver a tenerte con nosotros
        </p>
        {/* Decorador de línea bajo el subtítulo */}
        <div className="login-form-divider-accent" aria-hidden="true" />
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="login-form-fields">
        <Input
          type="email"
          placeholder="Correo electrónico"
          icon={<User size={18} />}
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="login-password-group">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            icon={<Lock size={18} />}
            error={errors.password?.message}
            {...register("password")}
            rightIcon={
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword(!showPassword)}
                className="login-eye-btn"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          <div className="login-forgot-link-wrapper">
            <a href="#" className="login-forgot-link">
              Olvidé mi contraseña
            </a>
          </div>
        </div>

        {/* Botón principal */}
        <Button
          id="btn-login"
          type="submit"
          fullWidth
          variant="primary"
          size="md"
          disabled={isPending}
        >
          {isPending ? "Iniciando..." : "Iniciar sesión"}
        </Button>
      </form>

      {/* Registro */}
      <p className="login-register-row">
        <span>¿Aún no tienes una cuenta?&nbsp;</span>
        <a href="#" className="login-register-link">
          Regístrate
        </a>
      </p>

      {/* Continúa con Google */}
      <button type="button" id="btn-google" className="login-google-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M23.7449 12.27C23.7449 11.48 23.6749 10.73 23.5549 10H12.2549V14.51H18.7249C18.4349 15.99 17.5849 17.24 16.3249 18.09V21.09H20.1849C22.4449 19.01 23.7449 15.92 23.7449 12.27Z"/>
          <path fill="#34A853" d="M12.2549 24C15.4949 24 18.2049 22.92 20.1849 21.09L16.3249 18.09C15.2449 18.81 13.8749 19.25 12.2549 19.25C9.13488 19.25 6.47488 17.14 5.52488 14.29H1.54488V17.38C3.51488 21.3 7.56488 24 12.2549 24Z"/>
          <path fill="#FBBC05" d="M5.52488 14.29C5.27488 13.57 5.14488 12.8 5.14488 12C5.14488 11.2 5.28488 10.43 5.52488 9.71V6.62H1.54488C0.724883 8.24 0.254883 10.06 0.254883 12C0.254883 13.94 0.724883 15.76 1.54488 17.38L5.52488 14.29Z"/>
          <path fill="#EA4335" d="M12.2549 4.75C14.0249 4.75 15.6049 5.36 16.8549 6.55L20.2749 3.13C18.2049 1.19 15.4949 0 12.2549 0C7.56488 0 3.51488 2.7 1.54488 6.62L5.52488 9.71C6.47488 6.86 9.13488 4.75 12.2549 4.75Z"/>
        </svg>
        <span>Continúa con Google</span>
      </button>
    </div>
  );
};
