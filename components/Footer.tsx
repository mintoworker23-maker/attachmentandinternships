type FooterLink = {
  label: string;
  href: string;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

type FooterProps = {
  brand?: string;
  description?: string;
  columns?: FooterColumn[];
};

const defaultColumns: FooterColumn[] = [
  {
    title: "Explore",
    links: [
      { label: "Find Jobs", href: "#" },
      { label: "Internships", href: "#" },
      { label: "Graduate Programs", href: "#" },
      { label: "Remote Roles", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export default function Footer({
  brand = "Attachment and Internships in Kenya",
  description = "Discover curated opportunities and stay close to roles that match your skills and goals.",
  columns = defaultColumns,
}: FooterProps) {
  return (
    <footer
      id="footer"
      className="relative isolate mx-auto mt-14 w-full max-w-7xl overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-950 px-6 py-10 text-slate-200 shadow-[0_30px_60px_-35px_rgba(2,6,23,0.95)] sm:px-10"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-4 h-[clamp(3.5rem,11vw,8rem)] overflow-hidden">
        <p
          className="w-full select-none text-center text-[clamp(6rem,22vw,17rem)] font-black uppercase leading-none tracking-[-0.04em] text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(148,163,184,0.32), rgba(148,163,184,0.14), rgba(148,163,184,0))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ATTACHMENT & INTERNSHIPS IN KENYA
        </p>
      </div>

      <div className="relative z-10 grid gap-10 border-b border-slate-800 pb-8 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <a href="#" className="text-2xl font-semibold tracking-tight text-white">
            {brand}
          </a>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">{description}</p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-300">
              {column.title}
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 transition hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-6 flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Attachment and Internships in Kenya. All rights reserved.</p>
        <a href="#" className="w-fit text-slate-400 transition hover:text-white">
          Manage cookies
        </a>
      </div>
    </footer>
  );
}
