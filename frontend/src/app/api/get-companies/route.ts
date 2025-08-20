import { supabase } from "@/lib/supabase";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const promptId = searchParams.get("promptId");

    if (!promptId) {
      return Response.json({ error: "promptId is required" }, { status: 400 });
    }

    // Get companies associated with this prompt
    const { data: relationshipData, error: relationshipError } = await supabase
      .from("prompt_to_scraped_company")
      .select(`
        scraped_company (
          id,
          name,
          address,
          website,
          normalized_domain,
          phone_number,
          reviews_count,
          reviews_average,
          store_shopping,
          in_store_pickup,
          store_delivery,
          place_type,
          opens_at,
          introduction,
          created_at,
          updated_at
        )
      `)
      .eq("prompt_id", promptId);

    if (relationshipError) {
      console.error("Database error:", relationshipError);
      return Response.json(
        { error: "Failed to fetch companies" },
        { status: 500 }
      );
    }

    // Extract the company data from the relationship records
    const companies = relationshipData?.map((item: any) => item.scraped_company) || [];

    return Response.json(companies);
  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}