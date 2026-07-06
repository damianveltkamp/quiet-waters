import Logo from "./components/Logo";
import SignupForm from "./components/SignupForm";

const GIFTS = [
  {
    num: "01",
    title: "A custom wallpaper with the lords scripture.",
    body: "Calming verses over still water, sized for your phone's lock screen. A quiet word every time you look down.",
  },
  {
    num: "02",
    title: "Meet his word on your phone every day.",
    body: "Spend more time getting closer to God.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f4f8f9_0%,#eaf2f5_55%,#e2edf1_100%)]">
      {/* NAV */}
      <nav className="mx-auto flex max-w-[1180px] items-center justify-between px-[clamp(20px,4vw,40px)] py-[26px]">
        <div className="flex items-center gap-[11px]">
          <Logo width={26} height={30} />
          <span className="font-serif text-[25px] font-medium leading-none tracking-[0.01em] text-ink">
            Quiet Waters
          </span>
        </div>
        <a
          href="#join"
          className="font-grotesk text-xs font-semibold uppercase tracking-[0.12em] text-mist-deep no-underline"
        >
          Join the list
        </a>
      </nav>

      {/* HERO */}
      <section className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-14 px-[clamp(20px,4vw,40px)] pt-[clamp(28px,6vh,72px)] pb-20">
        {/* LEFT: copy + form */}
        <div className="animate-qw-fade min-w-[320px] flex-[1_1_420px]">
          <div className="mb-[22px] font-grotesk text-[11px] font-semibold uppercase leading-none tracking-[0.24em] text-mist">
            A calm sanctuary for everyday faith
          </div>
          <h1 className="m-0 font-serif text-[clamp(44px,5.4vw,68px)] font-medium leading-[1.02] tracking-[0.005em] text-ink">
            You want to feel closer to god.
          </h1>
          <p className="mt-6 max-w-[30em] text-lg leading-[1.6] text-body">
            You&apos;re not walking this path alone. Join Christians all over
            the world drawing closer to God.
          </p>

          {/* FORM */}
          <div id="join" className="mt-[34px] max-w-[460px] scroll-mt-8">
            <SignupForm />
          </div>
        </div>

        {/* RIGHT: phone mockup */}
        <div className="relative flex min-w-[300px] flex-[1_1_360px] justify-center">
          {/* peeking wallpaper card behind */}
          <div className="absolute top-[46px] right-[8%] flex aspect-[9/16] w-[150px] rotate-[8deg] flex-col items-center justify-center rounded-[22px] bg-[linear-gradient(170deg,#c9dce5,#7fa6bc)] p-[18px] text-center shadow-[0_24px_60px_-28px_rgba(28,51,68,0.45)]">
            <div className="font-serif text-[15px] font-normal italic leading-[1.35] text-white">
              Peace I leave with you.
            </div>
            <div className="mt-2.5 font-grotesk text-[6px] font-semibold uppercase leading-none tracking-[0.16em] text-white/85">
              John 14:27
            </div>
          </div>

          {/* main phone */}
          <div className="animate-qw-float relative w-[clamp(240px,80%,300px)]">
            <div className="rounded-[42px] bg-ink p-[11px] shadow-[0_40px_90px_-30px_rgba(28,51,68,0.55)]">
              <div className="flex aspect-[9/19.3] flex-col overflow-hidden rounded-[33px] bg-canvas">
                {/* lock screen verse */}
                <div className="flex flex-1 flex-col items-center bg-[linear-gradient(180deg,#eaf2f5_0%,#dce9ee_50%,#c4d7e0_100%)] px-6 py-[30px]">
                  <div className="mt-2 font-grotesk text-[11px] font-semibold leading-none tracking-[0.04em] text-[#5e7e92]">
                    Tuesday, 6:41
                  </div>
                  <div className="mt-0.5 font-serif text-[46px] font-medium leading-none text-slate">
                    stillness
                  </div>
                  <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <Logo width={18} height={21} ripples={2} className="mb-4" />
                    <div className="font-serif text-[21px] font-medium leading-[1.35] text-ink">
                      &ldquo;He leads me beside quiet waters.&rdquo;
                    </div>
                    <div className="mt-3 font-grotesk text-[8px] font-semibold uppercase leading-none tracking-[0.18em] text-mist-deep">
                      Psalm 23:2
                    </div>
                  </div>
                  <div className="font-grotesk text-[8px] font-semibold uppercase leading-none tracking-[0.22em] text-[#9cb2be]">
                    Quiet Waters
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-[1180px] px-[clamp(20px,4vw,40px)] pt-16 pb-[72px]">
          <div className="mx-auto mb-11 max-w-[34em] text-center">
            <div className="mb-3.5 font-grotesk text-[11px] font-semibold uppercase leading-none tracking-[0.24em] text-mist">
              Your free gift
            </div>
            <h2 className="m-0 font-serif text-[clamp(30px,3.4vw,40px)] font-medium leading-[1.08] text-ink">
              The Stillness Collection
            </h2>
            <p className="mt-3.5 text-base leading-[1.6] text-body">
              A small, beautiful place to begin — landing in your inbox the
              moment you join.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-[18px]">
            {GIFTS.map((gift) => (
              <div
                key={gift.num}
                className="max-w-[340px] flex-[1_1_260px] rounded-[18px] border border-line bg-[#f7fafb] px-7 py-[30px]"
              >
                <div className="mb-3.5 font-serif text-[28px] leading-none text-water">
                  {gift.num}
                </div>
                <div className="mb-2 font-serif text-[22px] font-medium text-ink">
                  {gift.title}
                </div>
                <p className="m-0 text-[14.5px] leading-[1.6] text-muted">
                  {gift.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VERSE CLOSING */}
      <section className="bg-ink px-[clamp(20px,4vw,40px)] py-[72px] text-center">
        <Logo
          width={26}
          height={30}
          crossColor="#c9dce5"
          className="mx-auto mb-[22px]"
        />
        <p className="mx-auto m-0 max-w-[18em] font-serif text-[clamp(26px,3.4vw,38px)] font-normal italic leading-[1.35] text-[#eaf1f4]">
          &ldquo;Come to me, all you who are weary and burdened, and I will give
          you rest.&rdquo;
        </p>
        <div className="mt-5 font-grotesk text-[11px] font-semibold uppercase leading-none tracking-[0.2em] text-mist">
          Matthew 11:28
        </div>
        <a
          href="#join"
          className="mt-9 inline-block rounded-[30px] bg-water px-8 py-4 font-grotesk text-[15px] font-semibold leading-none text-ink no-underline transition-colors hover:bg-[#b4d2e0]"
        >
          Join the list it&apos;s free
        </a>
      </section>

      {/* FOOTER */}
      <footer className="bg-deep px-[clamp(20px,4vw,40px)] py-[30px]">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3.5">
          <div className="flex items-center gap-[9px]">
            <Logo width={18} height={21} crossColor="#c9dce5" ripples={1} />
            <span className="font-serif text-[17px] text-water-soft">
              Quiet Waters
            </span>
          </div>
          <div className="font-grotesk text-xs leading-[1.5] text-[#6e8597]">
            © 2026 Quiet Waters · A calm place for everyday faith
          </div>
        </div>
      </footer>
    </div>
  );
}
