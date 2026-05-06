import Image from "next/image";
<img src="public/header.png" />

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans bg-[var(--background)] text-[var(--foreground)]">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-24 px-8 bg-[var(--light)] rounded-2xl shadow-lg sm:items-start">
        <Image
          src="/header.png"
          alt="Homza logo"
          width={380}
          height={280} 
          priority   
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-bold leading-10 tracking-tight text-[var(--primary)]">
            Organize Your Home, Save Time & Money
          </h1>
          <p className="max-w-md text-lg leading-8 text-[var(--foreground)]">
            Take control of your household items, reduce waste, and manage your budget with smart organization. Track what you have, plan what you need, and make every minute and rupee count.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
