import { NextResponse } from "next/server";
import { Resend } from "resend";

// Good-enough email shape check to catch typos/garbage before we ever call
// Resend — not a full RFC-5322 validator, Resend does deeper validation too.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Adds a signup to the Resend Contacts audience (see resend.com/audience).
// That audience IS the mailing list — there's no separate database table.
// Sending the actual weekly email happens manually from Resend's Broadcasts
// dashboard, not from this app.
export async function POST(request: Request) {
  let email: unknown;

  try {
    const body = await request.json();
    email = body?.email;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return NextResponse.json(
      { error: "Newsletter signup is temporarily unavailable." },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.contacts.create({
    email: email.toLowerCase().trim(),
    unsubscribed: false,
  });

  if (error) {
    console.error("Resend contacts.create error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Try again in a bit." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
