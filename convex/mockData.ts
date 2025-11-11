import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { internal } from './_generated/api'

/**
 * Generate mock journal entries for testing
 * Called by: npm run generate-mock-entries -- --email "user@example.com" --count 10 --startDate "2025-01-01"
 */
export const generateMockEntries = mutation({
  args: {
    email: v.string(),
    count: v.optional(v.number()), // Default to 10 entries
    startDate: v.optional(v.number()), // Unix timestamp to start from (default: today)
  },
  handler: async (ctx, args) => {
    const count = args.count ?? 10
    const startTimestamp = args.startDate ?? Date.now()

    // Find user by email
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('email'), args.email))
      .first()

    if (!user) {
      throw new Error(`User not found with email: ${args.email}`)
    }

    // Mock entry templates with varied content (100+ words each)
    const mockEntries = [
      {
        content:
          "Woke up early today feeling refreshed and energized. The sunrise was absolutely beautiful, casting golden rays across my room. I spent some time meditating and setting intentions for the day. Feeling grateful for the simple moments like this. Started my day with a healthy breakfast and some light exercise. The morning air was crisp and invigorating. I've been thinking a lot about my goals and how to make progress on them. It's important to stay focused and not get distracted by all the noise around us. I want to make sure I'm spending my time on things that truly matter and bring value to my life and others. Today is going to be a great day, I can feel it.",
      },
      {
        content:
          "Had a productive day at work today. Completed the project I've been working on for the past two weeks. The team meeting went well, and everyone seems excited about the new direction we're taking. I learned some valuable lessons about project management and collaboration. It's amazing how much you can accomplish when everyone is aligned and working towards the same goal. I'm particularly proud of how we handled the challenges that came up. There were moments of uncertainty, but we pushed through and came out stronger. Looking forward to the next phase of this project and seeing where it takes us. The feedback from stakeholders has been overwhelmingly positive.",
      },
      {
        content:
          "Spent the evening reading and catching up on some personal projects. It's nice to have quiet time to myself after a busy day. I've been thinking about the importance of work-life balance and making time for the things I enjoy. Sometimes we get so caught up in our daily routines that we forget to pause and appreciate the present moment. I want to be more intentional about creating space for creativity and exploration. There's so much I want to learn and experience. Tonight reminded me of why it's important to nurture our passions and interests outside of work. I finished a book I've been reading and it left me with a lot to think about.",
      },
      {
        content:
          "Went on a hike this weekend and it was exactly what I needed. Being in nature has a way of clearing your mind and putting things in perspective. The trail was challenging but rewarding, with stunning views at the summit. I brought my camera and captured some amazing photos. It's moments like these that remind me to slow down and appreciate the beauty around us. After the hike, I grabbed coffee with a friend and we had a great conversation about life, dreams, and future plans. It's always inspiring to connect with people who are passionate about what they do and who challenge you to think differently about the world.",
      },
      {
        content:
          "Dedicated today to working on my creative projects. It felt amazing to lose track of time while being completely absorbed in the creative process. I experimented with some new techniques and ideas that I've been wanting to try. Not everything worked out perfectly, but that's part of the journey. The important thing is to keep showing up and putting in the work. I'm learning that creativity is not just about inspiration, but also about discipline and consistency. Some of my best ideas come when I'm just sitting down and doing the work, even when I don't feel particularly inspired. It's a reminder that we have more control over our creative output than we often think we do.",
      },
      {
        content:
          "Started learning something new today and it's both exciting and challenging. There's so much information to absorb and skills to develop. I'm trying to be patient with myself and remember that learning is a process. It's okay to make mistakes and not understand everything right away. What matters is that I'm making progress, even if it's slow. I've been taking notes and practicing regularly to reinforce what I'm learning. It's interesting how the more you learn, the more you realize how much you don't know. But that's what makes it exciting. There's always something new to discover and explore. I'm committed to this journey and excited to see where it leads me in the future.",
      },
      {
        content:
          "Spent quality time with family today. We cooked dinner together and shared stories from the week. It's these simple moments that I cherish the most. Everyone was in good spirits and it felt wonderful to be surrounded by the people I love. We laughed, we talked about memories, and we made plans for future gatherings. Family is everything to me, and I want to make sure I'm prioritizing these relationships. Life can get busy and it's easy to let time slip away, but I'm making a conscious effort to be more present and engaged. Today was a good reminder of what truly matters in life and why we work so hard to build a better future for those we care about.",
      },
      {
        content:
          "Hit a new personal record at the gym today and I'm feeling really proud of myself. The hard work and consistency are paying off. I've been following a structured training program for the past few months and I can see real progress. It's not just about the physical changes, but also the mental strength and discipline I've developed. Working out has become an important part of my daily routine. It helps me manage stress and gives me energy for the rest of the day. I've also learned a lot about nutrition and how to fuel my body properly. It's a holistic approach to health and wellness that I'm committed to maintaining for the long term.",
      },
      {
        content:
          "Started planning my next trip and I'm so excited about it. I've been researching destinations, reading travel blogs, and making a list of places I want to visit. There's something magical about planning an adventure and imagining all the experiences that await. Travel has always been important to me because it opens your mind to new cultures, perspectives, and ways of living. I want to explore more, learn more, and push myself out of my comfort zone. This trip is going to be an opportunity to disconnect from daily life and immerse myself in something completely different. I'm already counting down the days until departure and can't wait to share the experience with others.",
      },
      {
        content:
          "Dedicated time to mindfulness and meditation today. It's incredible how much clarity and peace you can find when you take time to sit with yourself. I've been practicing for a while now and I'm noticing real benefits in my daily life. I'm more patient, more present, and less reactive to stress. The practice has taught me to observe my thoughts without judgment and to create space between stimulus and response. It's not always easy, especially when my mind is racing with thoughts and worries, but that's exactly when the practice is most valuable. I'm committed to continuing this journey of self-discovery and inner peace. Today's session was particularly powerful and left me feeling centered and grounded.",
      },
      {
        content:
          "Attended a virtual conference today and was blown away by the quality of the speakers and discussions. Technology has made it so much easier to access learning opportunities from anywhere in the world. I took extensive notes on the key insights and ideas that resonated with me. One speaker talked about the importance of continuous learning and staying curious throughout your career. Another discussed the challenges of adapting to rapid change in our industry. The networking sessions were also valuable, allowing me to connect with professionals from different backgrounds and perspectives. I came away with several actionable ideas to implement in my own work. It's refreshing to step outside your usual routine and gain fresh perspectives on familiar challenges.",
      },
      {
        content:
          "Spent the afternoon organizing and decluttering my workspace. There's something therapeutic about creating order from chaos. I went through old papers, reorganized my desk, and created a more efficient filing system. A clean environment really does help with mental clarity and productivity. I also took time to reflect on my workflows and identified some areas where I can be more efficient. Sometimes we accumulate so much stuff without realizing how it weighs us down. Getting rid of things I no longer need felt liberating. I'm committed to maintaining this level of organization going forward. It's not just about aesthetics, but about creating an environment that supports my goals and helps me do my best work.",
      },
      {
        content:
          "Had a breakthrough moment on a problem I've been wrestling with for weeks. Sometimes the solution comes when you least expect it, often when you step away and give your mind space to process. I was taking a walk when suddenly everything clicked into place. I rushed back to write down all my ideas before they slipped away. This experience reminded me of the importance of taking breaks and not forcing solutions. Our brains need time to make connections and synthesize information. I'm excited to implement this new approach and see where it leads. It's moments like these that make all the hard work and frustration worthwhile. The creative process is mysterious and wonderful.",
      },
      {
        content:
          "Volunteered at a local community center today and it was incredibly rewarding. Giving back to the community is something I want to do more regularly. I met so many inspiring people who are working hard to make a difference in their neighborhoods. It puts your own challenges in perspective when you see what others are dealing with. The experience reminded me that we all have something valuable to contribute, regardless of our circumstances. I left feeling grateful for what I have and motivated to do more. Service to others is one of the most fulfilling things you can do. It's not just about helping others, but also about connecting with your community and being part of something larger than yourself.",
      },
      {
        content:
          "Experimented with a new recipe tonight and it turned out better than expected. Cooking has become a creative outlet for me, a way to unwind and try new things. I love the process of following a recipe but also adding my own touches and adjustments. Food brings people together in such a special way. I'm thinking of hosting a dinner party soon to share some of my favorite dishes with friends. There's something satisfying about creating something delicious from scratch and seeing others enjoy it. The kitchen has become my laboratory for experimentation. Sometimes recipes work perfectly, other times they're complete disasters, but that's part of the fun. The important thing is to keep trying and learning from each experience.",
      },
      {
        content:
          "Watched a documentary that completely changed my perspective on an important issue. It's amazing how powerful storytelling can be in helping us understand complex topics. The filmmakers did an incredible job presenting different viewpoints and letting the audience draw their own conclusions. I found myself thinking about the issues raised long after the credits rolled. It inspired me to do more research and get involved in some way. We often live in our own bubbles, unaware of the challenges others face. Documentaries like this one break down those barriers and help us develop empathy and understanding. I'm grateful for artists and journalists who dedicate their lives to shining light on important stories that need to be told.",
      },
      {
        content:
          "Reconnected with an old friend today and it felt like no time had passed at all. We talked for hours, catching up on each other's lives and reminiscing about shared memories. It's special when you have relationships that can pick up right where they left off, no matter how much time has passed. We discussed how we've both changed and grown over the years, yet the core of who we are remains the same. Friendships like this are rare and precious. I want to be better about staying in touch with the people who matter to me. Life gets busy, but maintaining relationships should be a priority. Today was a reminder of the importance of nurturing the connections that enrich our lives.",
      },
      {
        content:
          "Made significant progress on a long-term goal today and I'm feeling accomplished. Breaking big goals into smaller milestones makes them feel more achievable. Each step forward builds momentum and confidence. I've learned that success is not a straight line but a series of small wins punctuated by setbacks and challenges. The key is to stay focused on the bigger picture and not get discouraged by temporary obstacles. I'm tracking my progress carefully and adjusting my approach as needed. Flexibility and adaptability are just as important as persistence. Looking back at where I started, I can see how far I've come. That perspective is motivating and reminds me that consistent effort over time yields results.",
      },
      {
        content:
          "Took a digital detox day and it was exactly what I needed. No social media, no endless scrolling, just being present with myself and my surroundings. I read physical books, went for a long walk, and spent time journaling. The constant connectivity we have these days can be draining without us even realizing it. Stepping away helped me reconnect with what truly matters. I noticed I had more mental energy and felt less anxious. It's a reminder that we need to be intentional about our relationship with technology. I want to incorporate regular digital breaks into my routine. The world doesn't stop spinning if you're offline for a day, and the benefits to your mental health are significant.",
      },
      {
        content:
          'Attended a workshop on professional development and learned some valuable strategies for career growth. The facilitator was engaging and shared practical advice based on real-world experience. I appreciated the interactive format that encouraged participation and discussion. We worked through exercises that helped clarify our career goals and identify potential obstacles. One key takeaway was the importance of building a strong professional network and seeking out mentors. Another was the need to continually update your skills and stay relevant in a changing job market. I left with a concrete action plan and renewed motivation. Investing in yourself is one of the best decisions you can make. Your career is a marathon, not a sprint.',
      },
      {
        content:
          "Spent the day exploring a new neighborhood in the city. Sometimes the best adventures are close to home. I discovered charming cafes, interesting shops, and beautiful architecture I never knew existed. There's so much to see and experience if you just take the time to explore with fresh eyes. I talked to some locals who shared recommendations and stories about the area's history. It reminded me that every place has its own character and hidden gems waiting to be discovered. I took lots of photos to remember the day. Urban exploration is a hobby I want to pursue more actively. You don't need to travel far to have enriching experiences and broaden your horizons.",
      },
    ]

    const now = Date.now()
    const createdEntries = []

    for (let i = 0; i < count; i++) {
      // Generate entry dates going back in time (1 day apart) from startDate
      const daysAgo = i
      const entryDate = new Date(startTimestamp)
      entryDate.setDate(entryDate.getDate() - daysAgo)
      entryDate.setHours(0, 0, 0, 0)
      const entryTimestamp = entryDate.getTime()

      // Select a mock entry (cycle through the templates)
      const mockEntry = mockEntries[i % mockEntries.length]

      // Create TipTap JSON content
      const tiptapContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: mockEntry.content,
              },
            ],
          },
        ],
      }

      // Check if entry already exists for this date
      const existingEntry = await ctx.db
        .query('entries')
        .withIndex('userId_entryDate', (q) =>
          q.eq('userId', user._id).eq('entryDate', entryTimestamp),
        )
        .filter((q) => q.eq(q.field('isActive'), true))
        .first()

      if (existingEntry) {
        console.log(
          `Entry already exists for ${entryDate.toDateString()}, skipping...`,
        )
        continue
      }

      // Create the entry
      const entryId = await ctx.db.insert('entries', {
        userId: user._id,
        entryDate: entryTimestamp,
        content: JSON.stringify(tiptapContent),
        plainText: mockEntry.content,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })

      // Trigger AI title generation if entry has enough words
      const wordCount = mockEntry.content
        .split(/\s+/)
        .filter((word) => word.length > 0).length
      if (wordCount >= 100) {
        await ctx.scheduler.runAfter(0, internal.ai.generateEntryTitle, {
          entryId: entryId,
        })
      }

      createdEntries.push({
        id: entryId,
        date: entryDate.toDateString(),
        wordCount: wordCount,
      })
    }

    return {
      message: `Successfully created ${createdEntries.length} mock entries for ${args.email}`,
      entries: createdEntries,
    }
  },
})
