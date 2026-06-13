import { starterCover } from "./starterArt.js";

/** Bundled in the client — starter cards render instantly (no server fetch). */
export const STARTER_SUMMARIES = [
  {
    id: "house-party",
    title: "House Party Mix",
    description: "A little bit of everything — perfect for a mixed crowd.",
    emoji: "🎉",
    category: "Mixed",
    questionCount: 9,
    coverImage: starterCover("🎉", "#3b82f6", "Mixed trivia"),
  },
  {
    id: "movie-night",
    title: "Movie Night",
    description: "Lights, camera, trivia.",
    emoji: "🎬",
    category: "Movies",
    questionCount: 5,
    coverImage: starterCover("🎬", "#f43f5e", "Movies"),
  },
  {
    id: "general-knowledge",
    title: "General Knowledge",
    description: "A solid all-rounder to warm everyone up.",
    emoji: "🧠",
    category: "General",
    questionCount: 8,
    coverImage: starterCover("🧠", "#3b82f6", "General"),
  },
  {
    id: "kids-corner",
    title: "Kids' Corner",
    description: "Friendly questions for younger players.",
    emoji: "🧸",
    category: "Kids",
    questionCount: 8,
    coverImage: starterCover("🧸", "#f59e0b", "Kids"),
  },
  {
    id: "around-the-world",
    title: "Around the World",
    description: "Geography from every corner of the globe.",
    emoji: "🌍",
    category: "Geography",
    questionCount: 8,
    coverImage: starterCover("🌍", "#10b981", "Geography"),
  },
  {
    id: "family-faceoff",
    title: "Family Face-Off",
    description: "Cosy crowd-pleasers for the whole table.",
    emoji: "🏠",
    category: "Family",
    questionCount: 8,
    coverImage: starterCover("🏠", "#1d4ed8", "Family"),
  },
];
