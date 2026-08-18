import { NextResponse } from "next/server";
import { Resend } from "resend";

// Good-enough email shape check to catch typos/garbage before we ever call
// Resend — not a full RFC-5322 validator, Resend does deeper validation too.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Adds a signup to the Resend Audience that the weekly email broadcast
// (src/app/api/cron/weekly-email-draft) sends to. That audience IS the
// mailing list — there's no separate database table.
//
// Passing `audienceId` (not just leaving it off) is required here: without
// it, contacts.create() hits Resend's generic /contacts endpoint instead
// of /audiences/{id}/contacts, which adds the person to the account's
// overall contact pool but NOT to this specific audience — meaning the
// weekly broadcast has nobody to send to even though the account shows
// contacts. Confirmed the hard way: a first send failed with "The audience
// you are sending has no contacts" despite one already being subscribed.
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
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    console.error("RESEND_API_KEY or RESEND_AUDIENCE_ID is not set");
    return NextResponse.json(
      { error: "Newsletter signup is temporarily unavailable." },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.contacts.create({
    email: email.toLowerCase().trim(),
    unsubscribed: false,
    audienceId,
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
