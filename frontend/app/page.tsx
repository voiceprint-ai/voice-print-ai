import Features from "@/components/home/Features";
import Highlights from "@/components/home/Highlights";
import { Button } from "@/components/ui/Button";
import Link from "next/link";


function HomePage() {
  return (
    <main className="flex flex-col justify-between items-center">
      <section className="global-container z-1 relative">
        <div className="row flex flex-col justify-between items-center gap-4 md:gap-6 text-center max-w-5xl md:items-center">
          <h1 className="text-3xl md:text-5xl text-ink-900 text-shadow-md font-bold">
            Voice Print AI
          </h1>
          <h2 className= "text-md md:text-2xl text-gray-600 text-shadow-md tracking-wide md:tracking-widest font-bold max-w-100 md:max-w-176">
            Turn your writing history into a personal voice guide for clearer, more authentic drafts.
          </h2>
        </div>
      </section>

      <Features />

      <Highlights />

      <section className="global-container">
        <div className="row flex justify-center items-center">
          <Link 
            href='/dashboard'
          >
            <Button className="py-2 px-8 rounded-lg text-[18px] md:text-xl bg-ink-900 hover:bg-ink-900 text-shadow-2xs text-paper hover:scale-105 transition-transform duration-300 ease-in-out">
              Go to dashboard
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}

export default HomePage