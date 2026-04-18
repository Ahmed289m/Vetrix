import { LoginBranding } from "./_components/LoginBranding";
import { LoginForm } from "./_components/LoginForm";

export default function Login() {
  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-8%] w-[700px] h-[700px] rounded-full bg-emerald/5 blur-[140px]" />
        <div className="absolute bottom-[-25%] left-[-8%] w-[600px] h-[600px] rounded-full bg-cyan/4 blur-[120px]" />
        <div className="absolute top-[35%] left-[25%] w-[500px] h-[500px] rounded-full bg-orange/3 blur-[100px]" />
      </div>

      {/* Branding (left) */}
      <LoginBranding />

      {/* Vertical divider — visible on lg+ */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-border/30 to-transparent self-stretch my-8" />

      {/* Form (right) */}
      <LoginForm />
    </div>
  );
}
