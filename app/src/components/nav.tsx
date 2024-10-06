import React from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/router";
import type { DiscordProfile } from "next-auth/providers/discord";
import TrashcamIcon from "./logo.png";

const Nav: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignIn = () => {
    signIn("credentials", { callbackUrl: "/app" });
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const handleDispose = () => {
    router.push("/app");
  };

  return (
    <header className="sticky top-0 z-10 pt-6 pb-5 backdrop-filter backdrop-blur dark:bg-primary dark:text-white">
      <nav className="flex items-center justify-between h-16 font-semibold text-sm after:absolute after:inset-x-0 after:w-full after:h-12 after:shadow-hr after:z-[-1]">
        {/* Logo Section */}
        <div className="pl-6 pb-2 absolute" onClick={() => router.push("/")}>
          <Image
            src={TrashcamIcon}
            alt="Logo"
            width={64}
            height={64}
          />

        </div>

        {/* Title Section (Hidden on Mobile) */}
        <button
          className="text-1E635F text-2xl font-bold ml-[1rem] pl-20 hidden md:block" // Hidden on mobile
          onClick={() => router.push("/")}
        >
          TrashCam
        </button>

        {/* Right Section (Sign In/Out or Profile) */}
        <div className="flex items-center ml-auto"> {/* Move to the right */}
          {session ? (
            <>
              <button
                onClick={handleDispose}
                className="mr-4 px-4 py-2 text-white bg-1E635F rounded-full hover:bg-1E635F/80"
              >
                Dispose 🗑
              </button>
              <button onClick={handleSignOut} className="text-black text-base">Sign out</button>
            </>
          ) : (
            <button onClick={handleSignIn} className="text-black text-base">Sign in</button>
          )}

          {/* Profile Image */}
          <div className="ml-4 pr-3">
            {session && (
              <Image
                src={(session.user as DiscordProfile).image}
                alt="User profile"
                width={64}
                height={64}
                className="rounded-full"
              />
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Nav;
