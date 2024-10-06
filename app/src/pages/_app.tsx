import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import Nav from '../components/nav';
import AOS from 'aos';
import 'aos/dist/aos.css';

import { api } from "~/utils/api";

import "~/styles/globals.css"; // Your global styles
import { useEffect } from "react";
import Head from 'next/head'; // Import Head to add font link

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
    });
  }, []);

  return (
    <>
      <Head>
        {/* Google Fonts link for Exo 2 */}
        <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;700&display=swap" rel="stylesheet" />
      </Head>
      <SessionProvider session={session}>
        {/* Apply Exo 2 font */}
        <div className="font-sans">
          <Nav />
          <main className="h-full min-h-screen">
            <Component {...pageProps} />
          </main>
        </div>
      </SessionProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
