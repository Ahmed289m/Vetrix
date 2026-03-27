import { LoginBranding } from "./_components/LoginBranding";
import { LoginForm } from "./_components/LoginForm";

export default function Login() {
  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan/4 blur-[100px]" />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-orange/3 blur-[100px]" />
      </div>

      <LoginBranding />
      <LoginForm />
    </div>
  );
}

