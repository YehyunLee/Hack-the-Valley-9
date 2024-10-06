import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import TrashcamLeaderboard from "../components/trashcamLeaderboard";
import ObjectDetection from "~/components/objectDetection";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

export default function Home() {
  const { data: session } = useSession();

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <>
      <Head>
        <title>Trashcam</title>
        <meta name="description" content="Trashcam website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="snap-y snap-mandatory">
        {/* Welcome Section */}
        <section className="bg-DarkGreen snap-start flex flex-col items-center text-center py-16 px-4 md:px-8">
          <h1
            className="text-LightGreen text-3xl md:text-5xl font-extrabold"
            data-aos="fade-up"
          >
          Not Sure Where to Throw your Trash?
          </h1>

          {/* Separate each question into its own div for individual animation with larger top margin */}
          <div className="text-LightGreen text-lg md:text-2xl mt-4">

            <div className=" text-LightGreen mt-12" data-aos="fade-up"  data-aos-delay="300">
              Ever wondered if you're recycling correctly?
            </div>
            <div className="mt-12 text-LightGreen" data-aos="fade-up" data-aos-delay="500">
              Confused by local recycling rules?
            </div>
          </div>

          {/* New "We've got the solution!" section */}
          <div className="mt-16 text-center text-LightGreen" data-aos="fade-up" data-aos-delay="700">
            <h2 className="text-LightGreen text-3xl md:text-4xl font-bold">
              We've got the solution!
            </h2>
            <p className="text-507371 text-lg md:text-xl mt-4">
              Our app uses real-time object recognition to help you sort your trash
              instantly, making waste management easier and more eco-friendly.
            </p>
          </div>

          {/* Add more space below the text */}
          <div className="mt-12" data-aos="fade-up" data-aos-delay="900">
            {!session && <ObjectDetection />}
          </div>

          <div className="mt-8" data-aos="fade-up" data-aos-delay="1100">
            <AuthShowcase />
          </div>
        </section>

        {/* What is Trashcam Section */}
        <section className="bg-DarkGreen snap-start py-16 px-4 md:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h2
              className="text-LightGreen text-3xl md:text-4xl font-bold"
              data-aos="fade-right"
            >
              What is Trashcam?
            </h2>
            <div className="mt-6 space-y-6 text-LightGreen" data-aos="fade-up-right">
              <p className="text-lg md:text-xl">
                Trashcam is a fun and interactive way to explore the outdoors.
              </p>
              <p className="text-lg md:text-xl">
                Play, clean up trash, and contribute to a cleaner environment!
              </p>
            </div>
          </div>
        </section>

        {/* Leaderboard Section */}
        <section className="bg-DarkGreen snap-center py-16 px-4 md:px-8">
          <h1
            className="text-LightGreen text-3xl md:text-4xl font-bold text-center mb-4"
            data-aos="fade-up"
          >
            Leaderboard
          </h1>
          <p
            className="text-LightGreen text-lg md:text-xl text-center mb-8"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Compete to be in the top 5 on the leaderboard! 
            Play more, clean more, and climb to the top!
          </p>
          <div className="mb-8" data-aos="fade-up" data-aos-delay="200">
            <TrashcamLeaderboard />
          </div>
        </section>
      </div>
    </>
  );
}

function AuthShowcase() {
  const { data: sessionData } = useSession();
  const callbackUrl = "/app";

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4 md:px-0">
      {sessionData ? (
        <>
          <p className="text-xl md:text-2xl text-1E635F">
            Logged in as{" "}
            <span className="font-semibold">{sessionData.user?.name}</span>
          </p>
          <button
            className="rounded-full bg-1E635F text-white px-6 py-3 md:px-10 md:py-4 font-semibold transition hover:bg-1E635F/80"
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <p className="text-xl md:text-2xl text-LightGreen">
            Ready to start cleaning up? Sign in below!
          </p>
          <button
            className="rounded-full bg-White text-DarkGreen px-6 py-3 md:px-10 md:py-4 font-black transition hover:bg-1E635F/80"
            onClick={() => signIn("credentials", { callbackUrl })}
          >
            Sign in
          </button>
        </>
      )}
    </div>
  );
}
