import Image from "next/image";
import { Button } from "@/src/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-6 px-6 py-20 text-center">
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 -z-10 blur-3xl" style={{background:
            "radial-gradient(600px circle at 50% -20%, rgba(0,234,255,0.25), transparent 60%), radial-gradient(400px circle at 70% 20%, rgba(155,92,255,0.2), transparent 60%)"}} />
          <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl">
            TREADS
          </h1>
          <p className="mt-3 max-w-2xl text-balance text-lg text-foreground/70">
            Your AI-powered e-wardrobe with climate-aware looks, AR try-on, and neon flair.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="neon">Open Wardrobe</Button>
          <Button variant="outline">Learn More</Button>
        </div>
        <div className="mt-10 opacity-80">
          <Image src="/next.svg" alt="logo" width={120} height={24} />
        </div>
      </main>
    </div>
  );
}
