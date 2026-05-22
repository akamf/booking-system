export default function Home() {
  const activities = [
    { name: "Open court", time: "45 min", color: "bg-brand-500" },
    { name: "Training room", time: "60 min", color: "bg-emerald-500" },
    { name: "Youth session", time: "90 min", color: "bg-amber-500" },
  ];

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-brand-700">
              Sportshallen
            </div>
            <div className="text-xs text-neutral-500">Public booking</div>
          </div>
          <a
            href="http://localhost:3001"
            className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50"
          >
            Staff admin
          </a>
        </header>

        <section className="grid overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/10 lg:grid-cols-[1fr_420px]">
          <div className="p-8 lg:p-12">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
              Book time with confidence
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-neutral-950">
              Find the right activity, reserve a resource, and keep your visit
              on schedule.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-neutral-600">
              The public booking experience is being prepared. The structure
              below shows how families will compare activities, choose available
              slots, and see the booking rules before confirming.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Metric label="Activities" value="3" />
              <Metric label="Booking steps" value="4" />
              <Metric label="Staff review" value="Ready" />
            </div>
          </div>

          <aside className="border-t border-neutral-200 bg-neutral-950 p-6 text-white lg:border-l lg:border-t-0">
            <div className="rounded-lg border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold">Today preview</div>
              <div className="mt-4 space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.name}
                    className="flex items-center justify-between rounded-md bg-white px-3 py-3 text-neutral-950"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${activity.color}`}
                      />
                      <span className="text-sm font-medium">
                        {activity.name}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Step
            number="01"
            title="Choose activity"
            copy="Compare duration, age rules, and resource needs before searching slots."
          />
          <Step
            number="02"
            title="Pick a time"
            copy="Availability will account for opening hours, blocked times, and existing bookings."
          />
          <Step
            number="03"
            title="Confirm details"
            copy="Families will see clear booking status and staff can manage exceptions in admin."
          />
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <div className="text-2xl font-semibold text-neutral-950">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  copy,
}: {
  number: string;
  title: string;
  copy: string;
}) {
  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm shadow-neutral-900/5">
      <div className="text-xs font-semibold text-brand-700">{number}</div>
      <h2 className="mt-3 text-base font-semibold text-neutral-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-500">{copy}</p>
    </article>
  );
}
