import { scrape_companies } from "@/lib/google-maps-scraper";
import { supabase } from "@/lib/supabase";
import { NextRequest } from "next/server";

interface CompanySearchRequest {
  query: string;
  total?: number;
}

interface Company {
  name: string;
  address?: string;
  website?: string;
  phone_number?: string;
  place_id?: string;
  reviews_count?: number | null;
  reviews_average?: number | null;
  store_shopping?: string;
  in_store_pickup?: string;
  store_delivery?: string;
  place_type?: string;
  opens_at?: string;
  introduction?: string;
}

function normalizeWebsite(website?: string): string {
  if (!website) return "";

  try {
    // Add protocol if missing
    let url = website;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const parsed = new URL(url);
    let domain = parsed.hostname.toLowerCase();

    // Remove www. prefix
    if (domain.startsWith("www.")) {
      domain = domain.substring(4);
    }

    return domain;
  } catch {
    return website.toLowerCase().trim();
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: CompanySearchRequest;

    try {
      body = await req.json();
      console.log("Received body:", body);
    } catch (jsonError) {
      console.error("Failed to parse request body:", jsonError);
      console.error("Request method:", req.method);
      console.error(
        "Request headers:",
        Object.fromEntries(req.headers.entries())
      );
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { query, total = 20 } = body;

    if (!query) {
      return Response.json({ error: "Query is required" }, { status: 400 });
    }

    console.log(`Received request: query="${query}", total=${total}`);

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Helper function to send SSE messages
          const sendSSE = (data: any) => {
            const message = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(message));
          };

          sendSSE({
            type: "status",
            message: "Discovering new companies...",
            stage: "scraping",
          });

          // Scrape companies using your existing scraper
          const companies = await scrape_companies(query, total);

          // Filter companies that have websites
          const companiesWithWebsites = companies.filter(
            (company: Company) => company.website && company.website.trim()
          );

          console.log(
            `Found ${companiesWithWebsites.length} companies with websites out of ${companies.length} total`
          );

          if (companiesWithWebsites.length === 0) {
            sendSSE({
              type: "warning",
              message: "No companies with websites found.",
            });
            sendSSE({
              type: "complete",
              message: "Process completed with no results.",
            });
            controller.close();
            return;
          }

          // Store the prompt data first
          const promptData = {
            query_text: query,
            total_requested: total,
            total_found: companiesWithWebsites.length,
          };

          const { data: promptResult, error: promptError } = await supabase
            .from("prompt")
            .insert([promptData])
            .select()
            .single();

          const promptId = promptResult.id;

          // Prepare companies for scraped_company table with normalized domains
          const scrapedCompaniesRaw = companiesWithWebsites.map(
            (company: Company) => ({
              name: company.name || "",
              address: company.address || "",
              website: company.website || "",
              normalized_domain: normalizeWebsite(company.website),
              phone_number: company.phone_number || "",
              reviews_count: company.reviews_count || null,
              reviews_average: company.reviews_average || null,
              store_shopping: company.store_shopping || "No",
              in_store_pickup: company.in_store_pickup || "No",
              store_delivery: company.store_delivery || "No",
              place_type: company.place_type || "",
              opens_at: company.opens_at || "",
              introduction: company.introduction || "",
            })
          );

          // Deduplicate companies by normalized_domain to avoid conflicts
          const domainMap = new Map();
          const scrapedCompanies = scrapedCompaniesRaw.filter((company) => {
            if (!company.normalized_domain) return false;

            if (domainMap.has(company.normalized_domain)) {
              // If we already have this domain, keep the one with more complete data
              const existing = domainMap.get(company.normalized_domain);
              const currentScore =
                (company.phone_number ? 1 : 0) +
                (company.address ? 1 : 0) +
                (company.reviews_count ? 1 : 0);
              const existingScore =
                (existing.phone_number ? 1 : 0) +
                (existing.address ? 1 : 0) +
                (existing.reviews_count ? 1 : 0);

              if (currentScore > existingScore) {
                domainMap.set(company.normalized_domain, company);
              }
              return false;
            } else {
              domainMap.set(company.normalized_domain, company);
              return true;
            }
          });

          // Insert companies using upsert to handle duplicates
          const { data: companiesResult, error: companiesError } =
            await supabase
              .from("scraped_company")
              .upsert(scrapedCompanies, {
                onConflict: "normalized_domain",
              })
              .select();

          if (companiesError) {
            throw new Error(
              `Failed to store companies: ${companiesError.message}`
            );
          }

          sendSSE({
            type: "companies_found",
            companies: companiesResult,
          });

          if (companiesResult) {
            const storedCompanies = companiesResult;

            const relationships = storedCompanies.map((company: any) => ({
              prompt_id: promptId,
              scraped_company_id: company.id,
            }));

            const { data: relationshipResult, error: relationshipError } =
              await supabase
                .from("prompt_to_scraped_company")
                .upsert(relationships, {
                  onConflict: "prompt_id,scraped_company_id",
                })
                .select();
          } else {
            sendSSE({
              type: "warning",
              message:
                "Companies were processed but no data returned from database.",
            });
          }

          // TODO: Add contact finding logic here when ready
          // This is where you would integrate contact finding functionality

          // Send completion event
          sendSSE({
            type: "complete",
            message: "Process completed successfully.",
            data: {
              promptId,
              companiesFound: companiesWithWebsites.length,
              companiesStored: companiesResult?.length || 0,
            },
          });
        } catch (error) {
          console.error("Stream error:", error);
          const sendSSE = (data: any) => {
            const message = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(message));
          };

          sendSSE({
            type: "error",
            message: `An error occurred: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          });
        } finally {
          controller.close();
        }
      },
    });

    // Return the stream as a Server-Sent Events response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
