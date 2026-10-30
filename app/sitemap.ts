import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const siteUrl = "https://examprep-gamma.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: subjects } = await supabase.from("subjects").select("id");

  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...(subjects ?? []).map((subject) => ({
      url: `${siteUrl}/subject/${subject.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
