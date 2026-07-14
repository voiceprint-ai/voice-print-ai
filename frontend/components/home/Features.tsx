import { GiNotebook } from "react-icons/gi";
import { RiChatVoiceAiFill, RiLightbulbAiFill } from "react-icons/ri";

const FEATURES = [
  {
    Icon: GiNotebook,
    text: "Discover the patterns that define your writing style",
  },
  {
    Icon: RiLightbulbAiFill,
    text: "Track style shifts and measure your consistency",
  },
  {
    Icon: RiChatVoiceAiFill,
    text: "Generate new writing that better matches your personal voice",
  },
];

function Features() {
  return (
    <section className="global-container" aria-label="What Voiceprint does">
      <ul className="row flex flex-col md:flex-row gap-10 md:gap-16 justify-center items-center md:items-center text-base md:text-lg font-medium">
        {FEATURES.map(({ Icon, text }) => (
          <li key={text} className="flex flex-col max-w-64 gap-3 items-center text-center">
            <Icon size={32} aria-hidden="true" className="text-indigo-600" />
            <p>{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Features;