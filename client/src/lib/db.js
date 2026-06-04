import { supabase } from "./supabase.js";

// Data access for saved quizzes, question bank, quiz shares, and game history.
// Row Level Security on the server guarantees a user only ever reads/writes
// their own rows; we still scope every query by user_id for clarity.
// Quiz shares: import by code via get_quiz_share_by_code RPC (not a public table listing).

// Detects the "tables/policies aren't set up yet" class of error so the UI can
// show a precise call-to-action instead of a cryptic message.
export function isSetupError(error) {
  if (!error) return false;
  const code = error.code || "";
  const msg = `${error.message || ""} ${error.details || ""} ${error.hint || ""}`.toLowerCase();
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    code === "42501" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("row-level security") ||
    msg.includes("violates row-level security")
  );
}

// ---------------------------------------------------------------------------
// Saved quizzes
// ---------------------------------------------------------------------------

export async function listQuizzes(userId) {
  if (!supabase || !userId) return { data: [], error: null };
  return supabase
    .from("quizzes")
    .select("id, title, questions, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
}

export async function createQuiz(userId, { title, questions }) {
  if (!supabase) return { error: { message: "Login required." } };
  return supabase
    .from("quizzes")
    .insert({ user_id: userId, title, questions })
    .select()
    .single();
}

export async function updateQuiz(userId, id, { title, questions }) {
  if (!supabase) return { error: { message: "Login required." } };
  return supabase
    .from("quizzes")
    .update({ title, questions, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
}

export async function deleteQuiz(userId, id) {
  if (!supabase) return { error: { message: "Login required." } };
  return supabase.from("quizzes").delete().eq("id", id).eq("user_id", userId);
}

export async function duplicateQuiz(userId, quiz) {
  if (!supabase) return { error: { message: "Login required." } };
  const title = `${quiz.title} (copy)`.slice(0, 80);
  return supabase
    .from("quizzes")
    .insert({ user_id: userId, title, questions: quiz.questions })
    .select()
    .single();
}

// ---------------------------------------------------------------------------
// Question bank
// ---------------------------------------------------------------------------

export async function listBankQuestions(userId) {
  if (!supabase || !userId) return { data: [], error: null };
  return supabase
    .from("question_bank")
    .select("id, type, question, answers, correct, time_limit, image, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

export async function addBankQuestion(userId, q) {
  if (!supabase) return { error: { message: "Login required." } };
  return supabase
    .from("question_bank")
    .insert({
      user_id: userId,
      type: q.type || "mc",
      question: q.question,
      answers: q.answers,
      correct: q.correct,
      time_limit: q.timeLimit ?? 20,
      image: q.image || null,
    })
    .select()
    .single();
}

export async function deleteBankQuestion(userId, id) {
  if (!supabase) return { error: { message: "Login required." } };
  return supabase.from("question_bank").delete().eq("id", id).eq("user_id", userId);
}

// Normalise a bank row back to the editor question shape.
export function bankRowToQuestion(row) {
  return {
    type: row.type || "mc",
    question: row.question,
    answers: row.answers,
    correct: row.correct,
    timeLimit: row.time_limit,
    image: row.image || null,
  };
}

// ---------------------------------------------------------------------------
// Quiz sharing
// ---------------------------------------------------------------------------

function randomShareCode() {
  // 8 uppercase hex chars — easy to read, low collision risk for family use.
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }
  return Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
}

export async function createQuizShare(ownerId, quiz) {
  if (!supabase) return { error: { message: "Login required." } };
  const code = randomShareCode();
  return supabase
    .from("quiz_shares")
    .insert({
      code,
      owner_id: ownerId,
      quiz_title: quiz.title,
      questions: quiz.questions,
    })
    .select()
    .single();
}

export async function getQuizShare(code) {
  if (!supabase) return { error: { message: "Not configured." } };
  const { data, error } = await supabase.rpc("get_quiz_share_by_code", {
    share_code: code.trim(),
  });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row ?? null, error: row ? null : { message: "Not found" } };
}

export async function deleteQuizShare(userId, id) {
  if (!supabase) return { error: { message: "Login required." } };
  return supabase.from("quiz_shares").delete().eq("id", id).eq("owner_id", userId);
}

// ---------------------------------------------------------------------------
// Game history
// ---------------------------------------------------------------------------

export async function logGame(userId, { quizTitle, playerCount, winner }) {
  if (!supabase || !userId) return { error: null };
  return supabase.from("game_history").insert({
    user_id: userId,
    quiz_title: quizTitle,
    player_count: playerCount,
    winner,
  });
}

export async function listHistory(userId, limit = 5) {
  if (!supabase || !userId) return { data: [], error: null };
  return supabase
    .from("game_history")
    .select("id, quiz_title, player_count, winner, played_at")
    .eq("user_id", userId)
    .order("played_at", { ascending: false })
    .limit(limit);
}
