// ============================================================
// KREWTREE — Mock Worker Reviews
// Left by verified Krewtree employers only
// ============================================================

export type WorkerReview = {
  id: string
  workerId: string
  employerName: string
  employerInitials: string
  rating: number // 1.0–5.0
  commentary: string
  workerReply: string | null
  createdDate: string // ISO date
  source: 'krewtree'
}

export const workerReviews: WorkerReview[] = [
  // Marcus T. (w1) — Journeyman Carpenter — 5 reviews
  {
    id: 'rev-w1-1',
    workerId: 'w1',
    employerName: 'Harmon General Contracting',
    employerInitials: 'HG',
    rating: 5,
    commentary:
      'Marcus showed up on time every single day and his framing work was flawless. We had a tight timeline on a 12-unit townhome project and he kept the crew moving. Will absolutely hire again.',
    workerReply:
      'Appreciate the kind words — that was a great project to be part of. Looking forward to the next one.',
    createdDate: '2026-01-15',
    source: 'krewtree',
  },
  {
    id: 'rev-w1-2',
    workerId: 'w1',
    employerName: 'Pinnacle Build Group',
    employerInitials: 'PB',
    rating: 5,
    commentary:
      'Best carpenter we have worked with through Krewtree. Detail-oriented, communicates well with the project manager, and his finish work is genuinely impressive. Cabinets looked perfect.',
    workerReply: null,
    createdDate: '2025-10-28',
    source: 'krewtree',
  },
  {
    id: 'rev-w1-3',
    workerId: 'w1',
    employerName: 'Redstone Developments',
    employerInitials: 'RD',
    rating: 4,
    commentary:
      'Solid work overall. Framing was excellent and he was great with the apprentices on site. Docking one star because he was unavailable for a follow-up week we needed, but that was a scheduling issue not a quality one.',
    workerReply:
      'That timing was tough — I had a prior commitment I could not move. Happy to discuss scheduling upfront next time.',
    createdDate: '2025-08-11',
    source: 'krewtree',
  },
  {
    id: 'rev-w1-4',
    workerId: 'w1',
    employerName: 'BlueLine Construction',
    employerInitials: 'BC',
    rating: 5,
    commentary:
      'Marcus has deep knowledge and it shows. He caught a structural issue in the blueprints before we poured and saved us a significant rework. That kind of proactive thinking is rare.',
    workerReply: null,
    createdDate: '2025-05-03',
    source: 'krewtree',
  },
  {
    id: 'rev-w1-5',
    workerId: 'w1',
    employerName: 'Farview Homes',
    employerInitials: 'FH',
    rating: 5,
    commentary:
      'Third time hiring Marcus. He is reliable, skilled, and keeps a clean job site. He mentors junior workers naturally without being asked. An asset to any crew.',
    workerReply: 'Always a pleasure working with the Farview team. See you on the next project.',
    createdDate: '2025-02-19',
    source: 'krewtree',
  },

  // Priya S. (w2) — CNA — 4 reviews
  {
    id: 'rev-w2-1',
    workerId: 'w2',
    employerName: 'Sunrise Senior Living',
    employerInitials: 'SS',
    rating: 5,
    commentary:
      'Priya is an outstanding CNA. Our residents adore her and her documentation is always complete and accurate. She handles even the most challenging dementia care situations with patience and professionalism.',
    workerReply: null,
    createdDate: '2026-02-08',
    source: 'krewtree',
  },
  {
    id: 'rev-w2-2',
    workerId: 'w2',
    employerName: 'Valley Health & Rehab',
    employerInitials: 'VH',
    rating: 5,
    commentary:
      'Priya stepped into a short-staffed facility and immediately became indispensable. Her vitals work, wound care, and family communication skills exceeded our expectations for a temp placement.',
    workerReply:
      'It was a challenging assignment but the team made it work. Glad I could help during a difficult stretch.',
    createdDate: '2025-11-20',
    source: 'krewtree',
  },
  {
    id: 'rev-w2-3',
    workerId: 'w2',
    employerName: 'Clearwater Home Health',
    employerInitials: 'CH',
    rating: 4,
    commentary:
      'Great with patients and very reliable. Scheduling flexibility is somewhat limited — she cannot do overnight shifts — but within her stated availability she is excellent.',
    workerReply: null,
    createdDate: '2025-07-14',
    source: 'krewtree',
  },
  {
    id: 'rev-w2-4',
    workerId: 'w2',
    employerName: 'Elmwood Medical Center',
    employerInitials: 'EM',
    rating: 5,
    commentary:
      'We hired Priya for a 6-week post-surgical ward assignment. Her phlebotomy skills alone saved us from needing a separate contractor. Highly recommended.',
    workerReply: 'The post-surgical ward was a great learning experience. Thank you for the trust.',
    createdDate: '2025-04-01',
    source: 'krewtree',
  },

  // Diego R. (w3) — CDL-A Driver — 3 reviews
  {
    id: 'rev-w3-1',
    workerId: 'w3',
    employerName: 'Apex Logistics Group',
    employerInitials: 'AL',
    rating: 5,
    commentary:
      'Diego is one of the most dependable drivers we have placed through Krewtree. Zero incidents over 8 weeks, always delivered on time, and kept his HOS logs spotless. We are bringing him back for spring runs.',
    workerReply: null,
    createdDate: '2026-01-30',
    source: 'krewtree',
  },
  {
    id: 'rev-w3-2',
    workerId: 'w3',
    employerName: 'Central Freight Partners',
    employerInitials: 'CF',
    rating: 4,
    commentary:
      'Solid driver with excellent knowledge of regional routes. Punctual and professional. Communication with dispatch could be slightly more proactive during delays, but overall a reliable contractor.',
    workerReply: 'Fair feedback — I will be more proactive on delay communication going forward.',
    createdDate: '2025-09-05',
    source: 'krewtree',
  },
  {
    id: 'rev-w3-3',
    workerId: 'w3',
    employerName: 'GreenWay Distribution',
    employerInitials: 'GW',
    rating: 5,
    commentary:
      'Hired Diego for a 3-week regional fill. He pre-tripped meticulously and handled a tough weather day in the mountains without any issues. Professional and calm under pressure.',
    workerReply: null,
    createdDate: '2025-06-22',
    source: 'krewtree',
  },

  // Aaliyah M. (w4) — Line Cook — 2 reviews
  {
    id: 'rev-w4-1',
    workerId: 'w4',
    employerName: 'The Copper Kettle Restaurant Group',
    employerInitials: 'CK',
    rating: 5,
    commentary:
      'Aaliyah jumped into a Friday night service with barely any prep time and ran the sauté station like a pro. Speed, cleanliness, and her mise en place game is elite. We tried to hire her full-time.',
    workerReply: 'That service was a rush — loved every second of it. The kitchen team was great.',
    createdDate: '2025-12-08',
    source: 'krewtree',
  },
  {
    id: 'rev-w4-2',
    workerId: 'w4',
    employerName: 'Harborview Catering Co.',
    employerInitials: 'HC',
    rating: 4,
    commentary:
      'Strong knife skills and great energy in a high-volume event kitchen. Arrived 10 minutes late to setup which caused a small scramble but recovered quickly. Would hire again.',
    workerReply: null,
    createdDate: '2025-09-17',
    source: 'krewtree',
  },

  // James K. (w5) — Landscape Crew Leader — 3 reviews
  {
    id: 'rev-w5-1',
    workerId: 'w5',
    employerName: 'Greenfields Landscape & Design',
    employerInitials: 'GL',
    rating: 5,
    commentary:
      'James managed a 4-person crew for a major commercial hardscaping install. His irrigation knowledge and crew leadership meant we stayed on schedule despite a week of bad weather. Exceptional.',
    workerReply: null,
    createdDate: '2026-02-14',
    source: 'krewtree',
  },
  {
    id: 'rev-w5-2',
    workerId: 'w5',
    employerName: 'Sunridge Property Management',
    employerInitials: 'SP',
    rating: 5,
    commentary:
      'James and his crew transformed three commercial properties in a single contract period. He is organized, equipment-savvy, and communicates clearly with property managers who are not landscaping experts.',
    workerReply:
      'Sunridge properties are great to work with. Looking forward to the spring maintenance contract.',
    createdDate: '2025-11-03',
    source: 'krewtree',
  },
  {
    id: 'rev-w5-3',
    workerId: 'w5',
    employerName: 'Ironwood HOA Services',
    employerInitials: 'IH',
    rating: 4,
    commentary:
      'Good crew leader. Residents were happy with the common area results. We had one miscommunication about the scope of tree trimming that required a return visit, but James handled it graciously.',
    workerReply: null,
    createdDate: '2025-07-29',
    source: 'krewtree',
  },
]

export const getReviewsByWorker = (workerId: string): WorkerReview[] =>
  workerReviews.filter((r) => r.workerId === workerId)

export const getAverageRating = (workerId: string): number => {
  const reviews = getReviewsByWorker(workerId)
  if (!reviews.length) return 0
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
}

export const getStarSummary = (workerId: string): Record<number, number> => {
  const reviews = getReviewsByWorker(workerId)
  const summary: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach((r) => {
    const star = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5
    summary[star] = (summary[star] ?? 0) + 1
  })
  return summary
}
