import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
// import Link from "next/link";
import Image from "next/image";

import { api } from "~/utils/api";
import TrashcamLeaderboard from "~/components/trashcamLeaderboard";

const users: [string, number][] = [
  ['user1', 10],
  ['user2', 15],
  ['user3', 20],
  ['user4', 20],
  ['user5', 20]
];


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
          <div className="bg-F5FAFA snap-start">
            <div className="flex flex-col items-center gap-2 pb-4" data-aos="fade-up">
              <p className="text-1E635F mt-6 text-5xl font-extrabold">Welcome to Trashcam!</p>
              <p className="text-507371 text-2xl mb-4">
                ...
              </p>
            </div>


            <div className="flex flex-col items-center gap-2 text-black">
              <AuthShowcase />
            </div>

          </div>

          <div className="bg-DAF2F1 h-381 flex w-full flex-col items-center gap-2">
            <div style={{ transform: 'scale(1)' }}>
              <Image
                src="/landingpage.png"
                alt="Landing Page"
                width={780}
                height={742}
              />
            </div>
          </div>
          <div className="bg-F5FAFA snap-center">
            <h1 className='text-1E635F text-center pt-[2rem] mb-[1rem] text-3xl font-bold' >Leaderboard</h1>
            <TrashcamLeaderboard />
          </div>
          <div className="bg-F5FAFA snap-start">
            <div className="textBlock text-1E635F bg-F5FAFA flex pt-8 pb-8 w-[60vw] flex-col mr-[auto] ml-[auto] [&>*]:mb-[0.5rem]">
              <h2 data-aos="fade-right" className="text-3xl font-bold"> What is Trashcam?</h2>
              <div data-aos="fade-down-right">
                <p>...</p>
              </div>
              <div data-aos="fade-up-right">
                <p>...</p>
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
  const callbackUrl = '/play';

  return (
    <div className="flex flex-col items-center justify-center gap-2 pb-4">
      <p className="text-center text-2xl text-black">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
      </p>
      <button
        className="rounded-full bg-1E635F text-white px-10 py-3 font-semibold no-underline transition hover:bg-white hover:text-1E635F hover:bg-opacity-20"
        onClick={sessionData ? () => signOut() : () => signIn('credentials', { callbackUrl })}

      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>

    </div>

  );
}
