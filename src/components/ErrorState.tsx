import { Link } from "react-router";

interface Props {
  code?: string; // big decorative figure, e.g. "404"
  title: string;
  message: string;
  actionTo: string;
  actionLabel: string;
}

export default function ErrorState({ code, title, message, actionTo, actionLabel }: Props) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      {code && (
        <p aria-hidden className="text-6xl font-bold text-gold">
          {code}
        </p>
      )}
      <h1 className="mt-4 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted">{message}</p>
      <Link
        to={actionTo}
        className="mt-6 inline-block rounded-md bg-gold px-5 py-2 text-sm font-semibold text-canvas hover:bg-gold-deep transition-colors"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
