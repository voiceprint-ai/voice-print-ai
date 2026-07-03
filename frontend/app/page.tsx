import Features from "@/components/home/Features";
import Highlights from "@/components/home/Highlights";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col justify-between items-center text-center h-full overflow-scroll">
      <section className="global_container">
        <div className="row flex flex-col gap-4 md:gap-6">
          <h1 className="text-[26px] md:text-4xl text-shadow-lg text-shadow-cyan-300 font-extrabold">
            [AI Name], Your Creative Writing Partner
          </h1>
          <h2 className="text-gray-600 text-shadow-teal-200 text-shadow-lg tracking-wide md:tracking-widest text-lg md:text-xl font-bold">
            Detect Writing Style Shifts with AI
          </h2>
        </div>
      </section>
      <Features />
      <Highlights />
      <section className="global_container">
          <Link className="" href={'/dashboard'}>
            <button className="home__features--bg font-bold py-2 px-12 rounded-lg text-xl">
              Get started
            </button>
          </Link>
      </section>
    </main>
  );
}
