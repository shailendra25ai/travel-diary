import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { trip, entries, mode } = req.body

  if (!trip || !entries) {
    return res.status(400).json({ error: 'Missing trip or entries data' })
  }

  const entriesByDay = {}
  entries.forEach(entry => {
    if (!entriesByDay[entry.date]) entriesByDay[entry.date] = []
    entriesByDay[entry.date].push(entry)
  })

  const daysSummary = Object.entries(entriesByDay).map(([date, dayEntries]) => {
    const formatted = new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    if (mode === 'multi') {
      const perspectives = dayEntries.map(e =>
        `${e.userName}: ${e.text || '(photos only)'}${e.location ? ` [at ${e.location}]` : ''}`
      ).join('\n')
      return `${formatted}:\n${perspectives}`
    } else {
      const e = dayEntries[0]
      return `${formatted}: ${e.text || '(photos only)'}${e.location ? ` [at ${e.location}]` : ''}`
    }
  }).join('\n\n')

  const memberNames = mode === 'multi'
    ? [...new Set(entries.map(e => e.userName))].join(', ')
    : entries[0]?.userName || 'the traveller'

  const prompt = mode === 'multi'
    ? `You are a warm, talented travel writer. Write a beautiful multi-perspective trip recap for "${trip.title}" — a trip taken by ${memberNames}.

Here are diary entries from each person, day by day:

${daysSummary}

Write the following in a warm, vivid, personal tone:
1. A trip title (creative, evocative — not just the trip name)
2. An opening summary (3-4 sentences capturing the spirit of the trip and the group dynamic)
3. For each day that has entries: a short caption (1-2 sentences) that weaves together the different perspectives into one moment
4. A closing reflection (2-3 sentences about what made this trip special for this group)

Format your response as JSON with this structure:
{
  "title": "...",
  "summary": "...",
  "days": [{"date": "YYYY-MM-DD", "caption": "..."}],
  "closing": "..."
}`
    : `You are a warm, talented travel writer. Write a beautiful personal trip recap for "${trip.title}" by ${memberNames}.

Here are diary entries, day by day:

${daysSummary}

Write the following in a warm, vivid, first-person tone:
1. A trip title (creative, evocative — not just the trip name)
2. An opening summary (3-4 sentences capturing the spirit of the trip)
3. For each day that has entries: a short caption (1-2 sentences) bringing that day to life
4. A closing reflection (2-3 sentences about what this trip meant)

Format your response as JSON with this structure:
{
  "title": "...",
  "summary": "...",
  "days": [{"date": "YYYY-MM-DD", "caption": "..."}],
  "closing": "..."
}`

  const systemPrompt = `You are Mosaic — a warm, casual travel writer who turns ordinary diary entries into fun, magazine-quality recaps.

Voice rules:
- Write with warmth and personality — like a friend retelling a great trip
- Use everyday language, not literary or flowery prose
- Use present tense for day captions (it feels more alive)
- Keep day captions to 2-3 sentences max
- Avoid clichés: never use "amazing", "unforgettable", "experience of a lifetime"
- Prefer concrete details (the smell of rain, the laugh someone shared) over abstract feelings
- For multi-perspective recaps, weave together different members' contributions naturally — don't just list them

Format rules:
- Reading level: 8th-9th grade — accessible but not childish
- Trip title should be fun, 3-6 words, evocative
- Opening summary captures the spirit of the trip, not a play-by-play
- Closing reflection should feel warm and personal — like a friend wrapping up a good story`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    const recap = JSON.parse(jsonMatch[0])

    return res.status(200).json({ recap })
  } catch (err) {
    console.error('Claude API error:', err)
    return res.status(500).json({ error: 'Failed to generate recap. Please try again.' })
  }
}
