import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About ZyndAI",
  description: "ZyndAI is a service that identifies key individuals, initiates contact on your behalf, and schedules meetings. The goal is to save users time and effort by",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 prose">
      <h1>About ZyndAI</h1>
      <p>ZyndAI is a service that identifies key individuals, initiates contact on your behalf, and schedules meetings. The goal is to save users time and effort by handling the networking and scheduling process, allowing them to focus on attending the pre-arranged meetings.</p>
      <h2>What we do</h2>
      <ul>
        <li>Persona discovery</li>
        <li>Automated outreach</li>
        <li>Meeting scheduling</li>
        <li>Networking automation</li>
      </ul>
      <h2>Contact</h2>
      <p>Add your contact details here so readers (and AI engines) can verify who runs ZyndAI.</p>
    </main>
  );
}
