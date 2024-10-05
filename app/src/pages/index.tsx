import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";

import TrashcamLeaderboard from "../components/trashcamLeaderboard";

export default function Home() {
  return (
    <>
      <Head>
        <title>Trashcam</title>
        <meta name="description" content="Trashcam website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        <div className="snap-y snap-mandatory">
          {/* Welcome Section */}
          <div className="bg-F5FAFA snap-start">
            <div
              className="flex flex-col items-center gap-2 pb-4 px-4 md:px-0"
              data-aos="fade-up"
            >
              <p className="text-1E635F mt-6 text-4xl md:text-5xl font-extrabold text-center">
                Welcome to Trashcam!
              </p>
              <p className="text-507371 text-lg md:text-2xl mb-4 text-center">
                Join the fun and start exploring!
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 text-black">
              <AuthShowcase />
            </div>
          </div>

          {/* Image Section */}
          <div className="bg-DAF2F1 h-auto md:h-[381px] flex w-full flex-col items-center gap-2">
            <div className="scale-90 md:scale-100 w-full px-4 md:px-0">
              <Image
                src="/trashcan.jpg"
                alt="Landing Page"
                width={780}
                height={742}
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="bg-F5FAFA snap-center">
            <h1 className="text-1E635F text-center pt-6 md:pt-[2rem] mb-4 md:mb-[1rem] text-2xl md:text-3xl font-bold">
              Leaderboard
            </h1>
            <TrashcamLeaderboard />
          </div>

          {/* What is Trashcam Section */}
          <div className="bg-F5FAFA snap-start">
            <div className="textBlock text-1E635F bg-F5FAFA flex flex-col items-center pt-8 pb-8 w-full md:w-[60vw] px-4 md:px-0">
              <h2
                data-aos="fade-right"
                className="text-2xl md:text-3xl font-bold text-center"
              >
                What is Trashcam?
              </h2>
              <div className="mt-4" data-aos="fade-down-right">
                <p className="text-center">
                  Trashcam is a fun and interactive way to explore the outdoors.
                </p>
              </div>
              <div className="mt-4" data-aos="fade-up-right">
                <p className="text-center">
                  Play, clean up trash, and contribute to a cleaner environment!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AuthShowcase() {
  const { data: sessionData } = useSession();
  const callbackUrl = '/app';

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 md:px-0 pb-4">
      <p className="text-center text-xl md:text-2xl text-black">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
      </p>
      <button
        className="rounded-full bg-1E635F text-white px-6 md:px-10 py-2 md:py-3 font-semibold no-underline transition hover:bg-white hover:text-1E635F hover:bg-opacity-20"
        onClick={sessionData ? () => signOut() : () => signIn('credentials', { callbackUrl })}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
}
