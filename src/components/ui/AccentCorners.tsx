"use client";

export function AccentCorners({ dark }: { dark?: boolean }) {
  const darkClass = dark ? " dark" : "";
  return (
    <div className="events-none is-relative">
      <div className={`accent-left-top-corner${darkClass}`} />
      <div className={`accent-left-bottom-corner${darkClass}`} />
      <div className={`accent-right-top-corner${darkClass}`} />
      <div className={`accent-right-bottom-corner${darkClass}`} />
    </div>
  );
}
