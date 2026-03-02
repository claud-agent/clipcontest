import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// Optional: Send confirmation email via Resend
// Install: npm install resend
// Then uncomment the import and the email section below
// import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, role } = body;

    // Basic validation
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, E-Mail und Rolle sind erforderlich." },
        { status: 400 }
      );
    }
    if (!["creator", "participant"].includes(role)) {
      return NextResponse.json({ error: "Ungültige Rolle." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse." },
        { status: 400 }
      );
    }

    // Save to Supabase
    const supabase = createServerSupabaseClient();
    const { error: dbError } = await supabase.from("waitlist").insert([
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
      },
    ]);

    if (dbError) {
      // Duplicate email — friendly message
      if (dbError.code === "23505") {
        return NextResponse.json(
          { error: "Diese E-Mail ist bereits auf der Warteliste." },
          { status: 409 }
        );
      }
      console.error("Supabase error:", dbError);
      return NextResponse.json(
        { error: "Datenbankfehler. Bitte versuche es erneut." },
        { status: 500 }
      );
    }

    // -------------------------------------------------------
    // Send confirmation email via Resend (uncomment to enable)
    // -------------------------------------------------------
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: "ClipContest <noreply@clipcontest.io>",
    //   to: email,
    //   subject: "Du bist auf der Warteliste! 🎉",
    //   html: `
    //     <h1>Hey ${name}! 👋</h1>
    //     <p>Du bist jetzt offiziell auf der Warteliste von <strong>ClipContest</strong>.</p>
    //     <p>Wir melden uns, sobald wir launchen — und du bekommst als einer der Ersten Zugang.</p>
    //     <br />
    //     <p>Stay tuned,<br />Das ClipContest-Team</p>
    //   `,
    // });
    // -------------------------------------------------------

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Waitlist API error:", err);
    return NextResponse.json(
      { error: "Interner Serverfehler." },
      { status: 500 }
    );
  }
}
