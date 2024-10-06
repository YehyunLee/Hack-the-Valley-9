/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import ObjectDetection from "~/components/objectDetection"; // Import the Camera component

export default function App() {
  const { data: sessionData, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading, don't do anything yet

    if (!sessionData?.user) {
      router.push("/api/auth/signin?callbackUrl=%2Fapp");
    }
  }, [sessionData, status, router]);

  return (
    <>
      <Head>
        <title>App Auth</title>
        <meta name="description" content="Authentication Page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        {sessionData ? (
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 sm:text-2xl">
              Welcome, {sessionData.user?.name}!
            </h1>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-all sm:px-3 sm:py-1 sm:text-sm"
            >
              Sign Out
            </button>
            <div className="mt-8">
                <ObjectDetection />
              </div>
            </div>
        ) : (
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 sm:text-2xl">Please sign in</h1>
            <button
              onClick={() => signIn()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-all sm:px-3 sm:py-1 sm:text-sm"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
-
    </>
  );
}

