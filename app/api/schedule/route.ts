import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from/to required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("schedule")
    .select("*")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/schedule
// body: { date: '2025-11-05', slot: 'dropoff', who: 'thomas' | 'samboer' | null }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, slot, who } = body as {
    date: string;
    slot: "dropoff" | "pickup";
    who: string | null;
  };

  if (!date || !slot) {
    return NextResponse.json({ error: "date/slot required" }, { status: 400 });
  }

  // prøv å upserte (insert eller update)
  const { data, error } = await supabase
    .from("schedule")
    .upsert(
      [
        {
          date,
          slot,
          who,
        },
      ],
      {
        onConflict: "date,slot",
      }
    )
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
