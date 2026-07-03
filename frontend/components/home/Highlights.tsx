"use client";

import { useEffect, useState } from "react";

function Highlights() {
    const [itemGlow, setItemGlow] = useState<number>(0);
        
        useEffect(() => {
            const intervalId = setInterval(() => {
                setItemGlow((prev) => (prev + 1) % 4)
            }, 3000)
            
            return () => clearInterval(intervalId)
        },[])
    return (
        <section className="global_container">
            <div className="row flex flex-col items-center justify-between gap-6">
                <h1 className="font-bold text-xl">How it works</h1>
                <ol className="flex flex-col md:grid grid-cols-2 gap-10 text-white text-start justify-items-center">
                    <li className={`transition-colors duration-200 ease-in-out flex flex-col items-start bg-black p-4 rounded-2xl w-full md:max-w-88 ${itemGlow === 0 && 'text-emerald-400 text-shadow-xs text-shadow-cyan-400'}`}>
                        <span className="font-bold text-lg text-white">Upload your writing</span>
                        Add past samples or paste a new draft.
                    </li>
                    <li className={`transition-colors duration-200 ease-in-out flex flex-col items-start bg-black p-4 rounded-2xl w-full md:max-w-88 ${itemGlow === 1 && 'text-emerald-400 text-shadow-xs text-shadow-cyan-400'}`}>
                        <span className="font-bold text-lg text-white">Analyze your style</span>
                        Our AI studies tone, structure, vocabulary, and flow.
                    </li>
                    <li className={`transition-colors duration-200 ease-in-out flex flex-col items-start bg-black p-4 rounded-2xl w-full md:max-w-88 ${itemGlow === 2 && 'text-emerald-400 text-shadow-xs text-shadow-cyan-400'}`}>
                        <span className="font-bold text-lg text-white">Review your score</span>
                        See where your writing matches your voice and where it shifts.
                    </li>
                    <li className={`transition-colors duration-200 ease-in-out flex flex-col items-start bg-black p-4 rounded-2xl w-full md:max-w-88 ${itemGlow === 3 && 'text-emerald-400 text-shadow-xs text-shadow-cyan-400'}`}>
                        <span className="font-bold text-lg text-white">Write with confidence</span>
                        Generate improved drafts that stay closer to your style.
                    </li>
                </ol>
            </div>
        </section>
  )
}

export default Highlights