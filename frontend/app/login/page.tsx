import { LoginBranding } from "./_components/LoginBranding";
import { LoginForm } from "./_components/LoginForm";

export default function Login() {
  return (
    <div className="h-dvh min-h-dvh flex bg-background relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-20%] right-[-8%] rounded-full bg-emerald/5"
          style={{ width: 700, height: 700, filter: "blur(140px)" }}
        />
        <div
          className="absolute bottom-[-25%] left-[-8%] rounded-full bg-cyan/4"
          style={{ width: 600, height: 600, filter: "blur(120px)" }}
        />
        <div
          className="absolute top-[35%] left-[25%] rounded-full bg-orange/3"
          style={{ width: 500, height: 500, filter: "blur(100px)" }}
        />
      </div>

      {/* Branding (left) */}
      <LoginBranding />

      {/* Vertical divider — visible on lg+ */}
      <div
        className="hidden lg:block w-px self-stretch my-8"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, transparent, hsl(var(--border) / 0.3), transparent)",
        }}
      />

      {/* Form (right) */}
      <LoginForm />
    </div>
  );
}
