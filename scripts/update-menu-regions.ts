import {createClient} from '@sanity/client'

const apply = process.argv.includes('--apply')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || 'production'
const token = process.env.SANITY_API_TOKEN?.trim()

if (!projectId || !token) throw new Error('Sanity project configuration and SANITY_API_TOKEN are required.')

const client = createClient({projectId, dataset, token, apiVersion: '2025-02-19', useCdn: false, perspective: 'raw'})

const definitions = [
  {key: 'kannur', sourceKey: 'malabar-coast-signature-masala-grilled-fish', area: 'Kannur', region: 'North Kerala coast', coordinates: '11.8745° N · 75.3704° E', yearLabel: 'Fire and coast', courseLabel: 'Chargrilled fish', description: 'Kannur’s northern shoreline brings together fresh fish, warm spice and fire-led cooking with the confidence of North Malabar.'},
  {key: 'kozhikode', sourceKey: 'malabar-coast-signature-konju-coconut-fry', area: 'Kozhikode', region: 'North Malabar', coordinates: '11.2588° N · 75.7804° E', yearLabel: 'Coconut and coast', courseLabel: 'Coastal fry', description: 'Prawns, coconut and curry leaves carry the bold savoury character of Kozhikode and Kerala’s Arabian Sea shore.'},
  {key: 'palakkad', sourceKey: 'desserts-malabar-coast-special-dessert', area: 'Palakkad', region: 'The Kerala gap', coordinates: '10.7867° N · 76.6548° E', yearLabel: 'Rice and harvest', courseLabel: 'Festive sweet', description: 'Palakkad’s harvest landscape inspires a gentle, spice-warmed finish rooted in Kerala’s traditions of rice, milk and celebration.'},
  {key: 'kochi', sourceKey: 'malabar-coast-signature-prawn-moilee', area: 'Kochi', region: 'Central Kerala coast', coordinates: '9.9312° N · 76.2673° E', yearLabel: 'Harbour kitchen', courseLabel: 'Coconut curry', description: 'A harbour-side style of mild coconut curry, bright with ginger, green chilli and curry leaf around tender prawns.'},
  {key: 'kottayam', sourceKey: 'malabar-coast-signature-aattirachi-kurumulak', area: 'Kottayam', region: 'Central Travancore', coordinates: '9.5916° N · 76.5222° E', yearLabel: 'Pepper country', courseLabel: 'Pepper-spiced lamb', description: 'Black pepper, shallots and curry leaves echo the robust Syrian-Christian kitchens of Kottayam and central Travancore.'},
  {key: 'alappuzha', sourceKey: 'malabar-coast-signature-meen-moilee', area: 'Alappuzha', region: 'Backwater coast', coordinates: '9.4981° N · 76.3388° E', yearLabel: 'Backwater kitchen', courseLabel: 'Golden fish curry', description: 'Alappuzha’s backwater cooking meets tender fish, coconut milk, ginger and curry leaf in a gentle golden moilee.'},
] as const

async function main() {
const sourceKeys = definitions.map((definition) => definition.sourceKey)
const [pages, dishes] = await Promise.all([
  client.fetch<Array<{_id: string; voyageStops?: Array<{_key?: string; image?: unknown}>}>>(`*[_id in ["menuPage", "drafts.menuPage"]]{_id,voyageStops[]{_key,image}}`),
  client.fetch<Array<{_id: string; sourceKey: string; image?: unknown}>>(`*[_type == "menuItem" && sourceKey in $sourceKeys]{_id,sourceKey,image}`, {sourceKeys}),
])

if (!pages.some((page) => page._id === 'menuPage')) throw new Error('The published menuPage singleton does not exist.')
const dishByKey = new Map(dishes.map((dish) => [dish.sourceKey, dish._id]))
const dishImageByKey = new Map(dishes.map((dish) => [dish.sourceKey, dish.image]))
const missing = sourceKeys.filter((sourceKey) => !dishByKey.has(sourceKey))
if (missing.length) throw new Error(`Missing menu dishes: ${missing.join(', ')}`)

const createVoyageStops = (oldStops: Array<{_key?: string; image?: unknown}> = []) => definitions.map((definition, index) => ({
  _key: oldStops[index]?._key || definition.key,
  _type: 'object',
  dish: {_type: 'reference', _ref: dishByKey.get(definition.sourceKey)},
  area: definition.area,
  region: definition.region,
  coordinates: definition.coordinates,
  yearLabel: definition.yearLabel,
  courseLabel: definition.courseLabel,
  description: definition.description,
  ...(dishImageByKey.get(definition.sourceKey) ? {image: dishImageByKey.get(definition.sourceKey)} : oldStops[index]?.image ? {image: oldStops[index].image} : {}),
}))

const baseUpdate = {
  eyebrow: 'A taste of Kerala · North to South',
  headingLineOne: 'Six regions.',
  headingLineTwo: 'One Kerala.',
  introduction: 'Travel through six Kerala food landscapes, from Malabar’s biriyani kitchens to Kuttanad’s banana-leaf fish and the coconut-rich curries of the southern coast.',
  journeyLinkLabel: 'Explore Kerala',
}

const updates = pages.map((page) => ({
  id: page._id,
  value: {...baseUpdate, voyageStops: createVoyageStops(page.voyageStops)},
}))

if (!apply) {
  console.log(JSON.stringify({mode: 'dry-run', documents: updates.map((entry) => entry.id), headings: [baseUpdate.headingLineOne, baseUpdate.headingLineTwo], areas: definitions.map((stop) => stop.area)}, null, 2))
  return
}

let transaction = client.transaction()
for (const update of updates) transaction = transaction.patch(update.id, {set: update.value})
await transaction.commit()

const verified = await client.fetch<Array<{_id: string; _updatedAt: string; headingLineOne?: string; headingLineTwo?: string; areas: string[]}>>(
  `*[_id in ["menuPage", "drafts.menuPage"]] | order(_id asc){_id,_updatedAt,headingLineOne,headingLineTwo,"areas":voyageStops[].area}`,
)
const expectedAreas = definitions.map((definition) => definition.area)
if (!verified.every((document) => JSON.stringify(document.areas) === JSON.stringify(expectedAreas))) {
  throw new Error('Post-migration verification found an unexpected Kerala region list.')
}
console.log(JSON.stringify({mode: 'applied-and-verified', documents: verified, headings: [baseUpdate.headingLineOne, baseUpdate.headingLineTwo]}, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Menu-region migration failed.')
  process.exit(1)
})
