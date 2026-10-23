export type AdMode = "preroll" | "midroll" | "none";

export type CommentReply = {
  author: string;
  ago: string;
  body: string;
  likes: number;
};

export type VideoComment = {
  author: string;
  ago: string;
  body: string;
  likes: number;
  pinned?: boolean;
  replies?: CommentReply[];
};

export type Video = {
  id: string;
  title: string;
  channel: string;
  handle: string;
  views: string;
  published: string;
  durationLabel: string;
  description: string;
  tags: string[];
  adMode: AdMode;
  adTitle?: string;
  adBrand?: string;
  adCopy?: string;
  midrollAt?: number;
  theme: string;
  thumbnailUrl: string;
  thumbnailPosition?: string;
  avatarUrl: string;
  avatarPosition?: string;
  photoCredit: string;
  photoSource: string;
  transcript: string[];
  comments: VideoComment[];
};

// Thumbnail photos are from Unsplash pages marked "Free to use under the Unsplash License".
export const VIDEOS: Video[] = [
  {
    id: "v1",
    title: "Night Shift UI Notes and a Clean Editing Flow",
    channel: "Ella Research Lab",
    handle: "@ellaresearchlab",
    views: "1.4M views",
    published: "2 days ago",
    durationLabel: "13:24",
    description:
      "A light walkthrough of interface notes and editing flows put together late at night in the studio. A short ad plays before the video starts.",
    tags: ["design", "workflow", "setup"],
    adMode: "preroll",
    adTitle: "NOVA AIR PRO MAX",
    adBrand: "NOVA Tech",
    adCopy: "Ultra-light 30g, upgraded noise canceling, up to 32 hours of playback. Pre-order now and get the exclusive case for free.",
    theme: "from-[#2f2f70] via-[#4f46e5] to-[#82a2ff]",
    thumbnailUrl: "https://images.unsplash.com/photo-1751200065697-4461cc2b43cb?auto=format&fit=crop&fm=jpg&q=82&w=1400",
    thumbnailPosition: "center 55%",
    avatarUrl: "https://images.unsplash.com/photo-1745434159123-5b99b94206ca?auto=format&fit=crop&fm=jpg&q=82&w=240",
    avatarPosition: "center 38%",
    photoCredit: "Zoshua Colah",
    photoSource: "https://unsplash.com/photos/a-dimly-lit-desk-with-a-laptop-and-monitor-IUKdnYUlDco",
    transcript: [
      "Today I'll walk you through some interface notes and workflow I've been putting together.",
      "It's a short edited routine video, easy to watch at your own pace.",
      "I've also left the tools I used and reference links in the description.",
    ],
    comments: [
      {
        author: "soyeon",
        ago: "1 hour ago",
        body: "The opening vibe was so good I watched it straight to the end. Quiet but somehow easy to focus.",
        likes: 18,
        pinned: true,
        replies: [
          { author: "ellaresearchlab", ago: "54 min ago", body: "I intentionally kept the tone a bit muted at the start this time. Glad you caught that.", likes: 6 },
          { author: "hyemi", ago: "41 min ago", body: "Same here. Perfect to have running in the background late at night.", likes: 2 },
        ],
      },
      {
        author: "minjoon",
        ago: "32 min ago",
        body: "I'd love to see more videos with this studio-vlog feel. The visuals are so calm I keep watching.",
        likes: 7,
        replies: [
          { author: "ellaresearchlab", ago: "20 min ago", body: "Next time I'll include the editing routine and gear setup too.", likes: 3 },
        ],
      },
      { author: "hyejin", ago: "5 min ago", body: "Really helpful to have the description links organized like that. Saved them right away.", likes: 3 },
      {
        author: "dohyun_edit",
        ago: "2 hours ago",
        body: "The details around the search bar and comments section are subtly well done — fun to notice. Those small touches make a big difference.",
        likes: 14,
        replies: [
          { author: "pixelmomo", ago: "1 hour ago", body: "Agreed. The little interactions keep making me click around.", likes: 4 },
        ],
      },
      {
        author: "chae_vlog",
        ago: "1 hour ago",
        body: "Videos that show the work screen like this end up playing longer for me. I actually reach for these more than talkier videos.",
        likes: 11,
      },
      {
        author: "juniverse",
        ago: "48 min ago",
        body: "The new position of the skip ad button looks much more natural. It used to overlap a bit and bother me.",
        likes: 9,
        replies: [
          { author: "ellaresearchlab", ago: "37 min ago", body: "That was actually the part I refined the most this time. I wanted it to sit without drawing attention.", likes: 5 },
          { author: "ui_nari", ago: "29 min ago", body: "Much less jarring than before. Good that it doesn't break the flow of the video.", likes: 2 },
        ],
      },
      {
        author: "minkee",
        ago: "35 min ago",
        body: "Making the settings menu go one level deeper feels a lot like the real YouTube experience.",
        likes: 7,
      },
      {
        author: "sora_archive",
        ago: "26 min ago",
        body: "Having More and Less as plain buttons in the description is much clearer. Far less likely to collapse it by accident now.",
        likes: 6,
      },
      {
        author: "taeho_lab",
        ago: "19 min ago",
        body: "Replies being collapsed by default is much cleaner. Showing everything from the start made the comment section too long.",
        likes: 8,
        replies: [
          { author: "minjoon", ago: "12 min ago", body: "Agreed. This feels just right for the real YouTube experience.", likes: 2 },
        ],
      },
      {
        author: "rina.day",
        ago: "14 min ago",
        body: "The Shorts arrows overlapping in the middle feels more YouTube-like too. Way more natural than having them separate at the top.",
        likes: 5,
      },
      {
        author: "cloudframe",
        ago: "9 min ago",
        body: "Splitting main and video state by stateId also looks pretty convenient for testing.",
        likes: 4,
      },
      {
        author: "yeon_archive",
        ago: "7 min ago",
        body: "This type of video is better when the comments aren't too loud either. Nice that the vibe stays intact.",
        likes: 4,
      },
      {
        author: "woori.ui",
        ago: "3 min ago",
        body: "Overall it really does feel more and more like actual YouTube. The comment tone is natural too.",
        likes: 2,
      },
    ],
  },
  {
    id: "v2",
    title: "Late-night Studio Vlog with an Unexpected Mid-roll",
    channel: "Mock UI Studio",
    handle: "@mockuistudio",
    views: "93K views",
    published: "Today",
    durationLabel: "18:02",
    description:
      "A vlog from a late night in the studio. An ad appears once in the middle of the video.",
    tags: ["vlog", "studio", "edit"],
    adMode: "midroll",
    adTitle: "MIDNIGHT BURGER COMBO",
    adBrand: "BunBun Delivery",
    adCopy: "Late-night orders only. Double cheeseburger combo with large fries upgrade — just ₩4,900.",
    midrollAt: 35,
    theme: "from-[#3f2417] via-[#b45309] to-[#fbbf24]",
    thumbnailUrl: "https://images.unsplash.com/photo-1758553173287-513ad13280b6?auto=format&fit=crop&fm=jpg&q=82&w=1400",
    thumbnailPosition: "center 48%",
    avatarUrl: "https://images.unsplash.com/photo-1695927621677-ec96e048dce2?auto=format&fit=crop&fm=jpg&q=82&w=240",
    avatarPosition: "center 36%",
    photoCredit: "Jakub Zerdzicki",
    photoSource: "https://unsplash.com/photos/desk-with-cameras-lenses-and-computer-screen-ug_dR-fdlaE",
    transcript: [
      "Today I captured the feel of working in the studio until late at night.",
      "It flows like a short vlog, with one ad break in the middle.",
      "Near the end I'll briefly mention what I want to edit next.",
    ],
    comments: [
      {
        author: "jae",
        ago: "45 min ago",
        body: "The mid-roll ad didn't break the flow much. Nice.",
        likes: 21,
        pinned: true,
        replies: [
          { author: "anna", ago: "29 min ago", body: "Agreed. The vlog tempo kept it from feeling too disruptive.", likes: 4 },
        ],
      },
      { author: "anna", ago: "27 min ago", body: "The color grading and music vibe are really nice.", likes: 8 },
      {
        author: "daisy",
        ago: "11 min ago",
        body: "Would love to see a gear rundown video for the studio.",
        likes: 4,
        replies: [
          { author: "mockuistudio", ago: "7 min ago", body: "I'll put together a camera and lighting setup overview soon.", likes: 2 },
        ],
      },
    ],
  },
  {
    id: "v3",
    title: "Desk Setup Refresh and Favorite Productivity Tools",
    channel: "Grounding Arena",
    handle: "@groundingarena",
    views: "58K views",
    published: "5 days ago",
    durationLabel: "10:40",
    description:
      "A quick look at my refreshed desk setup and the productivity tools I've been using lately.",
    tags: ["desk", "tools", "productivity"],
    adMode: "none",
    theme: "from-[#103629] via-[#0f766e] to-[#34d399]",
    thumbnailUrl: "https://images.unsplash.com/photo-1755436612906-60fbd2bffd69?auto=format&fit=crop&fm=jpg&q=82&w=1400",
    thumbnailPosition: "center 52%",
    avatarUrl: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&fm=jpg&q=82&w=240",
    avatarPosition: "center 34%",
    photoCredit: "Matus Gocman",
    photoSource: "https://unsplash.com/photos/a-modern-home-office-desk-setup-with-a-computer-and-chair-PEUVPUrP744",
    transcript: [
      "Changing the desk layout really shifted how I work.",
      "Today I'll give a quick rundown of the tools I've been using most lately.",
      "I'll also leave product names and setup notes in the description.",
    ],
    comments: [
      {
        author: "researchbot",
        ago: "2 hours ago",
        body: "The desk lighting color is really great.",
        likes: 12,
        pinned: true,
        replies: [
          { author: "groundingarena", ago: "1 hour ago", body: "This time I cut back on the yellow tones and kept it green.", likes: 5 },
        ],
      },
      { author: "ella", ago: "1 hour ago", body: "Curious about the keyboard and mouse combo you're using.", likes: 10 },
      {
        author: "jiwoo",
        ago: "12 min ago",
        body: "It would be great to see a list of the apps you used too.",
        likes: 2,
        replies: [
          { author: "nara", ago: "9 min ago", body: "I was wondering about the note-taking app and timer app too.", likes: 1 },
        ],
      },
    ],
  },
  {
    id: "v4",
    title: "Weekend Editing Routine and Videos I Keep Rewatching",
    channel: "Agent Recovery Lab",
    handle: "@agentrecoverylab",
    views: "71K views",
    published: "1 week ago",
    durationLabel: "21:12",
    description:
      "A relaxed routine video sharing videos and playlists I keep rewatching while editing on the weekend.",
    tags: ["routine", "playlist", "weekend"],
    adMode: "preroll",
    adTitle: "LUNA SLEEP 7 NIGHTS FREE",
    adBrand: "LunaSleep",
    adCopy: "Rain sounds, white noise, sleep timer and more. New users get 7 days of premium sound for free.",
    theme: "from-[#3b143d] via-[#a21caf] to-[#f0abfc]",
    thumbnailUrl: "https://images.unsplash.com/photo-1764096534662-a194a348c4a0?auto=format&fit=crop&fm=jpg&q=82&w=1400",
    thumbnailPosition: "center 58%",
    avatarUrl: "https://images.unsplash.com/photo-1545919513-6e14302c7fe7?auto=format&fit=crop&fm=jpg&q=82&w=240",
    avatarPosition: "center 38%",
    photoCredit: "Yen Vu",
    photoSource: "https://unsplash.com/photos/desk-with-laptop-books-and-papers-at-night-UlHSF20AHu0",
    transcript: [
      "On weekends I slow down a bit and rewatch some of my favorite videos while I edit.",
      "In this video I'll share that playlist and routine.",
      "If you browse the recommended videos on the side, you'll find quite a few with a similar vibe.",
    ],
    comments: [
      {
        author: "noah",
        ago: "3 hours ago",
        body: "This calm weekend routine video is really easy to keep watching.",
        likes: 13,
        pinned: true,
        replies: [
          { author: "agentrecoverylab", ago: "2 hours ago", body: "On weekends I wanted to make something a little less stimulating.", likes: 4 },
        ],
      },
      { author: "yuna", ago: "53 min ago", body: "The vibe makes it easy to keep going into the recommended videos.", likes: 6 },
      {
        author: "alice",
        ago: "24 min ago",
        body: "Please upload more of these editing routine videos.",
        likes: 5,
        replies: [
          { author: "noah", ago: "18 min ago", body: "Agreed. A playlist edition alongside it would be great.", likes: 2 },
        ],
      },
    ],
  },
  {
    id: "v5",
    title: "Kitchen Notes, Egg Rice, and a Tiny Weekend Reset",
    channel: "Home Loop",
    handle: "@homeloop",
    views: "270K views",
    published: "10 days ago",
    durationLabel: "28:19",
    description:
      "A short weekend record of making egg rice and tidying up the fridge.",
    tags: ["food", "weekend", "home"],
    adMode: "none",
    theme: "from-[#6f4a10] via-[#d0891a] to-[#f1cd69]",
    thumbnailUrl: "https://images.unsplash.com/photo-1600326145359-3a44909d1a39?auto=format&fit=crop&fm=jpg&q=82&w=1400",
    thumbnailPosition: "center 52%",
    avatarUrl: "https://images.unsplash.com/photo-1551184451-76b762941ad6?auto=format&fit=crop&fm=jpg&q=82&w=240",
    avatarPosition: "center 42%",
    photoCredit: "Joshua Ryder",
    photoSource: "https://unsplash.com/photos/egg-with-rice-on-black-pan-I51a7Yy7mQA",
    transcript: [
      "This weekend I started by tidying up the fridge and making a simple meal.",
      "Even one small routine task makes the space feel a bit more settled.",
      "Next time I'll talk about fridge organization.",
    ],
    comments: [
      {
        author: "mira",
        ago: "2 days ago",
        body: "The egg rice looks so good.",
        likes: 42,
        pinned: true,
        replies: [
          { author: "homeloop", ago: "1 day ago", body: "A splash of soy sauce and a small pat of butter makes it even better.", likes: 8 },
        ],
      },
      { author: "hyun", ago: "1 day ago", body: "Love the brunch vlog atmosphere.", likes: 11 },
      {
        author: "suji",
        ago: "18 hours ago",
        body: "I keep coming back to your weekend videos.",
        likes: 7,
        replies: [
          { author: "mira", ago: "16 hours ago", body: "Perfect to have on at low volume in the background.", likes: 3 },
        ],
      },
    ],
  },
  {
    id: "v6",
    title: "Rainy City Playlist for Working Late",
    channel: "JUPLI",
    handle: "@jupli",
    views: "210 views",
    published: "3 days ago",
    durationLabel: "2:38:33",
    description:
      "A calm playlist to put on during late-night work sessions when it's raining.",
    tags: ["music", "playlist", "rain"],
    adMode: "none",
    theme: "from-[#9476aa] via-[#c39db7] to-[#8ba0bb]",
    thumbnailUrl: "https://images.unsplash.com/photo-1741550005226-b5660b55d97f?auto=format&fit=crop&fm=jpg&q=82&w=1400",
    thumbnailPosition: "center 50%",
    avatarUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&fm=jpg&q=82&w=240",
    avatarPosition: "center",
    photoCredit: "Josh Hild",
    photoSource: "https://unsplash.com/photos/rainy-city-street-scene-at-night-with-people-HnbLT7zO5Lc",
    transcript: [
      "I picked this playlist for late-night work sessions.",
      "The tracks are mostly instrumental or low on vocals — great for focusing.",
      "Put it on while the rain falls outside.",
    ],
    comments: [
      {
        author: "melo",
        ago: "2 days ago",
        body: "The thumbnail colors match the music vibe really well.",
        likes: 17,
        pinned: true,
        replies: [
          { author: "jupli", ago: "1 day ago", body: "I adjusted the thumbnail to match the rainy tone.", likes: 4 },
        ],
      },
      { author: "riku", ago: "1 day ago", body: "Saving this for late-night work sessions.", likes: 8 },
      {
        author: "nara",
        ago: "15 hours ago",
        body: "Please keep this series going.",
        likes: 5,
        replies: [
          { author: "riku", ago: "12 hours ago", body: "A city night view version would be great too.", likes: 2 },
        ],
      },
    ],
  },
  {
    id: "v7",
    title: "Cafe Sound Mix for Deep Focus Sessions",
    channel: "LoopStation KR",
    handle: "@loopstationkr",
    views: "84K views",
    published: "4 days ago",
    durationLabel: "1:12:04",
    description:
      "A soft cafe ambience mix for long reading, planning, and deep focus sessions.",
    tags: ["music", "playlist", "focus"],
    adMode: "none",
    theme: "from-[#2d241b] via-[#8b5e34] to-[#d4a373]",
    thumbnailUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&fm=jpg&q=82&w=1400",
    thumbnailPosition: "center 52%",
    avatarUrl: "https://i.pravatar.cc/240?img=26",
    avatarPosition: "center",
    photoCredit: "Unsplash",
    photoSource: "https://unsplash.com/s/photos/cafe",
    transcript: [
      "This mix keeps the background soft and steady.",
      "I added light room tone and low-volume cafe movement.",
      "Use it when you want something present but not distracting.",
    ],
    comments: [
      { author: "riku", ago: "1 day ago", body: "This is exactly the background sound I use for long tasks.", likes: 15, pinned: true },
      { author: "nara", ago: "20 hours ago", body: "The volume balance is really comfortable.", likes: 6 },
    ],
  },
  {
    id: "v8",
    title: "Tokyo Night Walk After the Last Train",
    channel: "NightCraft",
    handle: "@nightcraft",
    views: "132K views",
    published: "6 days ago",
    durationLabel: "34:18",
    description:
      "A quiet city walk through late-night streets after the last train has passed.",
    tags: ["vlog", "travel", "night"],
    adMode: "none",
    theme: "from-[#111827] via-[#334155] to-[#94a3b8]",
    thumbnailUrl: "https://images.unsplash.com/photo-1741550005226-b5660b55d97f?auto=format&fit=crop&fm=jpg&q=82&w=1400",
    thumbnailPosition: "center 48%",
    avatarUrl: "https://i.pravatar.cc/240?img=23",
    avatarPosition: "center",
    photoCredit: "Josh Hild",
    photoSource: "https://unsplash.com/photos/rainy-city-street-scene-at-night-with-people-HnbLT7zO5Lc",
    transcript: [
      "The station is quiet now, so the city sounds are easier to hear.",
      "I kept the camera movement slow for this walk.",
      "The last few streets have the best reflections.",
    ],
    comments: [
      { author: "melo", ago: "2 days ago", body: "Night walk videos like this are so easy to leave on.", likes: 23, pinned: true },
      { author: "yeon_archive", ago: "1 day ago", body: "The reflections make it feel cinematic without trying too hard.", likes: 8 },
    ],
  },
  {
    id: "v9",
    title: "Small Apartment Plant Care Without Overwatering",
    channel: "Daydream Works",
    handle: "@daydreamworks",
    views: "46K views",
    published: "8 days ago",
    durationLabel: "9:55",
    description:
      "A practical plant care routine for small apartments, dry rooms, and busy weeks.",
    tags: ["home", "plants", "routine"],
    adMode: "none",
    theme: "from-[#1f3d2b] via-[#4d7c4a] to-[#a7c957]",
    thumbnailUrl: "https://images.unsplash.com/photo-1752224543110-35faed040b91?auto=format&fit=crop&fm=jpg&q=82&w=1400",
    thumbnailPosition: "center 50%",
    avatarUrl: "https://i.pravatar.cc/240?img=29",
    avatarPosition: "center",
    photoCredit: "Dhony Koswara",
    photoSource: "https://unsplash.com/photos/a-cozy-desk-with-plants-and-a-laptop-rcJcJ9urV7c",
    transcript: [
      "The easiest mistake is watering on a fixed schedule.",
      "I check soil depth first, then decide what each plant needs.",
      "Small rooms also need better airflow than most people expect.",
    ],
    comments: [
      { author: "suji", ago: "3 days ago", body: "This helped me stop overwatering my desk plants.", likes: 19, pinned: true },
      { author: "hyun", ago: "2 days ago", body: "The airflow tip was new to me.", likes: 5 },
    ],
  },
  {
    id: "v10",
    title: "What's In My Camera Bag for Quiet Travel Films",
    channel: "Bench & Flow",
    handle: "@benchflow",
    views: "67K views",
    published: "9 days ago",
    durationLabel: "16:42",
    description:
      "A compact travel camera kit for slow city films, desk b-roll, and low-light walks.",
    tags: ["camera", "travel", "gear"],
    adMode: "none",
    theme: "from-[#27272a] via-[#57534e] to-[#d6d3d1]",
    thumbnailUrl: "https://images.unsplash.com/photo-1758553173287-513ad13280b6?auto=format&fit=crop&fm=jpg&q=82&w=1400",
    thumbnailPosition: "center 48%",
    avatarUrl: "https://i.pravatar.cc/240?img=32",
    avatarPosition: "center",
    photoCredit: "Jakub Zerdzicki",
    photoSource: "https://unsplash.com/photos/desk-with-cameras-lenses-and-computer-screen-ug_dR-fdlaE",
    transcript: [
      "This kit is built around keeping the bag light.",
      "I only carry lenses that solve a specific shooting problem.",
      "For quiet travel films, stabilization matters more than specs.",
    ],
    comments: [
      { author: "daisy", ago: "2 days ago", body: "The lens choices make a lot of sense for travel.", likes: 12, pinned: true },
      { author: "cloudframe", ago: "1 day ago", body: "Would love a low-light comparison next.", likes: 4 },
    ],
  },
  {
    id: "v11",
    title: "Budget Meal Prep With Fried Tofu and Rice",
    channel: "FoodPod",
    handle: "@foodpod",
    views: "118K views",
    published: "11 days ago",
    durationLabel: "12:07",
    description:
      "A simple prep routine using crispy tofu, rice, vegetables, and a spicy sauce.",
    tags: ["food", "meal prep", "home"],
    adMode: "none",
    theme: "from-[#4a2c14] via-[#b45309] to-[#facc15]",
    thumbnailUrl: "https://images.unsplash.com/photo-1762305194201-077e7e23ccf2?auto=format&fit=crop&fm=jpg&q=82&w=1400",
    thumbnailPosition: "center 50%",
    avatarUrl: "https://i.pravatar.cc/240?img=45",
    avatarPosition: "center",
    photoCredit: "Lee Milo",
    photoSource: "https://unsplash.com/photos/crispy-fried-tofu-cubes-sprinkled-with-green-onions-N0lnO0gZlW8",
    transcript: [
      "The tofu stays crisp if you cool it before packing.",
      "I keep the sauce separate until the meal is ready.",
      "This batch is built for three quick lunches.",
    ],
    comments: [
      { author: "mira", ago: "4 days ago", body: "This looks easy enough for a weekday lunch box.", likes: 31, pinned: true },
      { author: "woori.ui", ago: "3 days ago", body: "The sauce ratio worked really well.", likes: 9 },
    ],
  },
  {
    id: "v12",
    title: "Calm Morning Yoga Before Opening the Laptop",
    channel: "Slow Room",
    handle: "@slowroom",
    views: "39K views",
    published: "2 weeks ago",
    durationLabel: "22:31",
    description:
      "A gentle morning yoga flow before work, designed for small bedrooms and low energy days.",
    tags: ["wellness", "routine", "morning"],
    adMode: "none",
    theme: "from-[#374151] via-[#64748b] to-[#cbd5e1]",
    thumbnailUrl: "https://images.unsplash.com/photo-1758272422576-aed8fde4cc55?auto=format&fit=crop&fm=jpg&q=82&w=1400",
    thumbnailPosition: "center 50%",
    avatarUrl: "https://i.pravatar.cc/240?img=48",
    avatarPosition: "center",
    photoCredit: "Vitaly Gariev",
    photoSource: "https://unsplash.com/photos/woman-meditating-peacefully-in-a-bedroom-vn3PG8zmi0w",
    transcript: [
      "This routine starts slowly, before the shoulders are awake.",
      "Keep the breath steady and make the movements small.",
      "The goal is to feel ready for the day, not exhausted.",
    ],
    comments: [
      { author: "yuna", ago: "5 days ago", body: "This pace is perfect before work.", likes: 14, pinned: true },
      { author: "rina.day", ago: "4 days ago", body: "I like that it does not need much space.", likes: 7 },
    ],
  },
];

export type Short = {
  id: string;
  title: string;
  channel: string;
  views: string;
  theme: string;
  thumbnailUrl: string;
  thumbnailPosition?: string;
};

export const SHORTS: Short[] = [
  { id: "s1", title: "People with the Most Routine Lives", channel: "FoodPod", views: "270K views", theme: "from-[#c2185b] via-[#e91e63] to-[#f48fb1]", thumbnailUrl: "https://images.unsplash.com/photo-1752224543110-35faed040b91?auto=format&fit=crop&fm=jpg&q=82&w=900", thumbnailPosition: "center" },
  { id: "s2", title: "'Dubu' is going viral abroad... is this real?", channel: "DailyDubu", views: "1.08M views", theme: "from-[#1565c0] via-[#1976d2] to-[#90caf9]", thumbnailUrl: "https://images.unsplash.com/photo-1762305194201-077e7e23ccf2?auto=format&fit=crop&fm=jpg&q=82&w=900", thumbnailPosition: "center" },
  { id: "s3", title: "Diet secrets that actually work right now", channel: "Health Lab", views: "960K views", theme: "from-[#2e7d32] via-[#388e3c] to-[#a5d6a7]", thumbnailUrl: "https://images.unsplash.com/photo-1680991172715-4074203a40d3?auto=format&fit=crop&fm=jpg&q=82&w=900", thumbnailPosition: "center 42%" },
  { id: "s4", title: "Mom running away from her 13-year-old", channel: "ParentingChannel", views: "1.4M views", theme: "from-[#e65100] via-[#f57c00] to-[#ffcc02]", thumbnailUrl: "https://images.unsplash.com/photo-1761030149081-50abb59676ef?auto=format&fit=crop&fm=jpg&q=82&w=900", thumbnailPosition: "center" },
  { id: "s5", title: "Controversial retirement of a 1.54M subscriber YouTuber", channel: "CreatorNews", views: "2.8M views", theme: "from-[#4a148c] via-[#7b1fa2] to-[#ce93d8]", thumbnailUrl: "https://images.unsplash.com/photo-1758553173287-513ad13280b6?auto=format&fit=crop&fm=jpg&q=82&w=900", thumbnailPosition: "center 48%" },
  { id: "s6", title: "Late-night solo mukbang vlog", channel: "nightfood", views: "520K views", theme: "from-[#263238] via-[#37474f] to-[#78909c]", thumbnailUrl: "https://images.unsplash.com/photo-1600326145359-3a44909d1a39?auto=format&fit=crop&fm=jpg&q=82&w=900", thumbnailPosition: "center" },
  { id: "s7", title: "Top 5 Things Cats Hate", channel: "CatLab", views: "2.1M views", theme: "from-[#bf360c] via-[#d84315] to-[#ffab91]", thumbnailUrl: "https://images.unsplash.com/photo-1677909959075-2a69a1768efd?auto=format&fit=crop&fm=jpg&q=82&w=900", thumbnailPosition: "center" },
];

export const SIDEBAR_CHANNELS = [
  { name: "Ella Research Lab", initial: "E", color: "bg-indigo-600", imageUrl: "https://images.unsplash.com/photo-1745434159123-5b99b94206ca?auto=format&fit=crop&fm=jpg&q=82&w=160" },
  { name: "Mock UI Studio", initial: "M", color: "bg-amber-700", imageUrl: "https://images.unsplash.com/photo-1695927621677-ec96e048dce2?auto=format&fit=crop&fm=jpg&q=82&w=160" },
  { name: "Grounding Arena", initial: "G", color: "bg-teal-700", imageUrl: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&fm=jpg&q=82&w=160" },
  { name: "Agent Recovery Lab", initial: "A", color: "bg-purple-700", imageUrl: "https://images.unsplash.com/photo-1545919513-6e14302c7fe7?auto=format&fit=crop&fm=jpg&q=82&w=160" },
  { name: "Home Loop", initial: "H", color: "bg-orange-700", imageUrl: "https://images.unsplash.com/photo-1551184451-76b762941ad6?auto=format&fit=crop&fm=jpg&q=82&w=160" },
  { name: "JUPLI", initial: "J", color: "bg-slate-600", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&fm=jpg&q=82&w=160" },
  { name: "NightCraft", initial: "N", color: "bg-rose-700", imageUrl: "https://images.unsplash.com/photo-1551184451-76b762941ad6?auto=format&fit=crop&fm=jpg&q=82&w=160" },
  { name: "LoopStation KR", initial: "L", color: "bg-cyan-700", imageUrl: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&fm=jpg&q=82&w=160" },
  { name: "Daydream Works", initial: "D", color: "bg-green-700", imageUrl: "https://images.unsplash.com/photo-1745434159123-5b99b94206ca?auto=format&fit=crop&fm=jpg&q=82&w=160" },
  { name: "Bench & Flow", initial: "B", color: "bg-pink-700", imageUrl: "https://images.unsplash.com/photo-1695927621677-ec96e048dce2?auto=format&fit=crop&fm=jpg&q=82&w=160" },
];

export const RECENT_SEARCHES = [
  "YouTube Shorts editing",
  "desk setup recommendations",
  "late night work vlog",
  "egg rice recipe",
  "focus playlist",
  "UI design tutorial",
  "noise canceling earphones",
  "morning routine vlog",
  "Figma shortcuts",
];

export const FILTERS = [
  "All",
  "Music",
  "Mix",
  "Live",
  "Recently uploaded",
  "Watched",
  "New for you",
] as const;

export type FilterType = (typeof FILTERS)[number];

export function getVideoById(id: string): Video | undefined {
  return VIDEOS.find((v) => v.id === id);
}
