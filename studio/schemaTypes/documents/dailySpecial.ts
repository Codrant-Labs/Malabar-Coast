import {defineArrayMember, defineField, defineType} from 'sanity'

const weekdayOptions = [
  {title: 'Monday', value: 'monday'},
  {title: 'Tuesday', value: 'tuesday'},
  {title: 'Wednesday', value: 'wednesday'},
  {title: 'Thursday', value: 'thursday'},
  {title: 'Friday', value: 'friday'},
  {title: 'Saturday', value: 'saturday'},
  {title: 'Sunday', value: 'sunday'},
]

export const dailySpecial = defineType({
  name: 'dailySpecial',
  title: "Today's special",
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Dish or special name', type: 'string', validation: (rule) => rule.required().min(3).max(90)}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}, validation: (rule) => rule.required()}),
    defineField({
      name: 'status',
      title: 'Availability',
      type: 'string',
      options: {list: [
        {title: 'Available', value: 'active'},
        {title: 'Sold out', value: 'soldOut'},
        {title: 'Paused', value: 'paused'},
      ], layout: 'radio'},
      initialValue: 'active',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'image', title: 'Special image', type: 'imageWithAlt', validation: (rule) => rule.required()}),
    defineField({name: 'badge', title: 'Short label', type: 'string', description: 'For example “Today only” or “Chef’s pick”.', validation: (rule) => rule.max(35)}),
    defineField({name: 'description', title: 'Description', type: 'text', rows: 3, validation: (rule) => rule.required().max(260)}),
    defineField({name: 'pricePence', title: 'Price in pennies', type: 'number', description: '1695 means £16.95.', validation: (rule) => rule.required().integer().min(0)}),
    defineField({name: 'priceNote', title: 'Optional price note', type: 'string', description: 'For example “while stocks last”.', validation: (rule) => rule.max(70)}),
    defineField({name: 'dietaryNote', title: 'Dietary or allergen note', type: 'string', validation: (rule) => rule.max(140)}),
    defineField({name: 'menuItem', title: 'Connect to an orderable menu item', type: 'reference', to: [{type: 'menuItem'}], description: 'When connected and orderable, guests can add the special directly to their order.'}),
    defineField({name: 'activeDays', title: 'Days available', type: 'array', of: [defineArrayMember({type: 'string'})], options: {list: weekdayOptions}, validation: (rule) => rule.unique()}),
    defineField({name: 'startsAt', title: 'Show from', type: 'datetime'}),
    defineField({
      name: 'endsAt',
      title: 'Show until',
      type: 'datetime',
      validation: (rule) => rule.custom((endsAt, context) => {
        const startsAt = context.document?.startsAt
        if (startsAt && endsAt && new Date(String(endsAt)) <= new Date(String(startsAt))) return 'Show until must be later than Show from.'
        return true
      }),
    }),
    defineField({name: 'callToAction', title: 'Optional action', type: 'link'}),
    defineField({name: 'displayOrder', title: 'Display order', type: 'number', initialValue: 100, validation: (rule) => rule.required().integer().min(0)}),
  ],
  orderings: [{title: 'Display order', name: 'displayOrder', by: [{field: 'displayOrder', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', status: 'status', price: 'pricePence', media: 'image'},
    prepare: ({title, status, price, media}) => ({
      title,
      subtitle: `${status === 'active' ? 'Available' : status === 'soldOut' ? 'Sold out' : 'Paused'} · ${typeof price === 'number' ? `£${(price / 100).toFixed(2)}` : 'Price needed'}`,
      media,
    }),
  },
})
