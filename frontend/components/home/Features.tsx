import { GiNotebook } from "react-icons/gi"
import { RiChatVoiceAiFill, RiLightbulbAiFill } from "react-icons/ri";

function Features() {
    return (
        <section className="global_container">
            <ul className="row flex flex-col md:flex-row gap-12 md:gap-32 justify-between md:justify-center items-center text-md md:text-lg font-semibold">
                <li className="flex flex-col max-w-60 md:max-w-48 gap-3 items-center">
                    <GiNotebook size={32} />
                    <h1 className="flex-1">
                        Discover the patterns that define your writing style
                    </h1>
                </li>
                <li className="flex flex-col max-w-56 md:max-w-48 gap-3 items-center">
                    <RiLightbulbAiFill size={30} />
                    <h1 className="flex-1">
                        Track style shifts and measure your consistency
                    </h1>
                </li>
                <li className="flex flex-col max-w-56 md:max-w-48 gap-3 items-center">
                    <RiChatVoiceAiFill size={28} />
                    <h1 className="flex-1">
                        Generate new writing that better matches your personal voice
                    </h1>
                </li>
            </ul>
        </section>
    )
}

export default Features