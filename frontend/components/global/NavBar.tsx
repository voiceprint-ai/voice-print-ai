import Image from "next/image";
import Link from "next/link";
import { FaRegUser } from "react-icons/fa";

function NavBar() {
  return (
    <div className="h-[10vh]">
        <div className="row flex justify-between items-center h-full gap-3">
            <figure>
                {/* Todo: create app logo
                <Image
                    src=""
                    alt="Voice print AI logo"
                    width={24}
                    height={40} /> */}
                <div className="w-24 h-12 bg-gray-300"></div>
            </figure>
            <div className="flex justify-between items-center gap-8 font-medium">
                <Link className="link__hover-effect" href={'/'}>Home</Link>
                <Link className="link__hover-effect" href={'/dashboard'}>Dashboard</Link>    
                <button 
                    aria-label="profile"
                    className="w-10 h-10 rounded-[50%] bg-gray-100 flex justify-center items-center">
                    <FaRegUser size={20} />
                </button>
            </div>
        </div>
    </div>
  )
}

export default NavBar