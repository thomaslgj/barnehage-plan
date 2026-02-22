import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const HOUSEHOLD_ID = "default";

// GET /api/equipment
export async function GET(req: NextRequest) {
  const { data, error } = await supabase
    .from("household_equipment_status")
    .select("*")
    .eq("household_id", HOUSEHOLD_ID)
    .order("item_key", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST /api/equipment
// body: { item_key: string, status: 'ok' | 'missing' }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { item_key, status } = body as {
    item_key: string;
    status: "ok" | "missing";
  };

  if (!item_key || !status) {
    return NextResponse.json(
      { error: "item_key and status required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("household_equipment_status")
    .upsert(
      [
        {
          household_id: HOUSEHOLD_ID,
          item_key,
          status,
          updated_at: new Date().toISOString(),
        },
      ],
      {
        onConflict: "household_id,item_key",
      }
    )
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

