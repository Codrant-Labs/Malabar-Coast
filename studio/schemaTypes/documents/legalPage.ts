import {defineArrayMember, defineField, defineType} from 'sanity'

export const legalPage = defineType({
  name: 'legalPage',
  title: 'Legal page',
  type: 'document',
  fields: [
    defineField({name: 'pageKey', title: 'Page', type: 'string', options: {list: [
      {title: 'Privacy policy', value: 'privacy'},
      {title: 'Cookie policy', value: 'cookie'},
      {title: 'Returns and refunds', value: 'returns'},
      {title: 'Payments and website terms', value: 'payments'},
    ]}, validation: (rule) => rule.required()}),
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
    defineField({name: 'summary', title: 'Summary', type: 'text', rows: 3}),
    defineField({name: 'lastUpdated', title: 'Last updated', type: 'date'}),
    defineField({
      name: 'sections',
      title: 'Page sections',
      description: 'Each section appears in the page index and in the policy document.',
      type: 'array',
      of: [defineArrayMember({
        type: 'object',
        fields: [
          defineField({name: 'sectionId', title: 'Section ID', type: 'slug', options: {source: (_document, options) => (options.parent as {title?: string})?.title || 'section'}, validation: (rule) => rule.required()}),
          defineField({name: 'title', title: 'Heading', type: 'string', validation: (rule) => rule.required()}),
          defineField({
            name: 'body',
            title: 'Content',
            type: 'array',
            of: [defineArrayMember({
              type: 'block',
              styles: [
                {title: 'Normal', value: 'normal'},
                {title: 'Subheading', value: 'h3'},
                {title: 'Quote', value: 'blockquote'},
              ],
              marks: {annotations: [defineArrayMember({
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [defineField({name: 'href', title: 'URL or site path', type: 'string', validation: (rule) => rule.required()})],
              })]},
            })],
            validation: (rule) => rule.required(),
          }),
        ],
        preview: {select: {title: 'title', subtitle: 'sectionId.current'}},
      })],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'body',
      title: 'Legacy content',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
      deprecated: {reason: 'Move this copy into Page sections so headings and the page index stay editable.'},
      readOnly: true,
      hidden: ({value}) => value === undefined,
    }),
    defineField({name: 'seo', title: 'Search and sharing', type: 'seo'}),
  ],
  preview: {select: {title: 'title', subtitle: 'pageKey'}},
})
