import {createClient} from "next-sanity";
import {site} from "../app/lib/site";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const token = process.env.SANITY_API_TOKEN?.trim();

if (!projectId || !token) throw new Error("Sanity project configuration or write token is missing.");

const client = createClient({projectId, dataset, token, apiVersion: "2026-09-06", useCdn: false});

async function main() {
  const settings = await client.fetch<{_id: string} | null>(
    `*[_type == "siteSettings"][0]{_id}`,
  );
  if (!settings) throw new Error("Site settings do not exist in Sanity.");

  await client.patch(settings._id).set({
    coordinates: site.geo,
    mapUrl: site.maps.directionsUrl,
    mapEmbedUrl: site.maps.embedUrl,
  }).commit();

  const home = await client.fetch<{
    _id: string;
    sections?: Array<{
      _key?: string;
      secondaryLink?: {href?: string; [key: string]: unknown};
      [key: string]: unknown;
    }>;
  } | null>(`*[_type == "marketingPage" && pageKey == "home"][0]{_id,sections}`);
  if (home?.sections) {
    const sections = home.sections.map((section) => section._key === "home-reservations"
      ? {
          ...section,
          secondaryLink: {
            ...section.secondaryLink,
            href: site.maps.directionsUrl,
          },
        }
      : section);
    await client.patch(home._id).set({sections}).commit();
  }

  const verified = await client.fetch<{
    coordinates?: {latitude?: number; longitude?: number};
    mapUrl?: string;
    mapEmbedUrl?: string;
  } | null>(`*[_id == $id][0]{coordinates,mapUrl,mapEmbedUrl}`, {id: settings._id});

  if (
    verified?.mapEmbedUrl !== site.maps.embedUrl
    || verified.mapUrl !== site.maps.directionsUrl
    || verified.coordinates?.latitude !== site.geo.latitude
    || verified.coordinates?.longitude !== site.geo.longitude
  ) throw new Error("The Google Maps settings could not be verified after the update.");

  const homeDirections = await client.fetch<string | null>(
    `*[_type == "marketingPage" && pageKey == "home"][0].sections[_key == "home-reservations"][0].secondaryLink.href`,
  );
  if (home && homeDirections !== site.maps.directionsUrl) {
    throw new Error("The homepage directions link could not be verified after the update.");
  }

  console.log(JSON.stringify({siteSettingsId: settings._id, homepageId: home?._id, verified: true}));
}

void main();
