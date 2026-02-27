import React, { useMemo, useState } from "react";
import { Player as EnginePlayer } from "./core/Player";
import { GameEngine } from "./core/GameEngine";
import { EffectResolver } from "./effects/EffectResolver";
import { ConsoleLogger } from "./services/Logger";
import { DefaultRandomProvider } from "./services/RandomProvider";
import { Berserker, Trickster, Lightweight, Tank, SocialButterfly, Gremlin, Lawyer, Cleric, TimeTraveler, Bartender } from "./roles";

type CardType = "Truth" | "Dare" | "Rule" | "Wildcard";

type Player = { id: string; name: string };

type GameCard = {
  id: string;
  type: CardType;
  title: string;
  prompt: string;
  intensity: 1 | 2 | 3;
};

type BiernetCard = {
  id: string;
  title: string;
  text: string;
  sipsMin: number;
  sipsMax: number;
  requires: readonly string[];
  source: "biernet";
};

type RoundRecord = {
  id: string;
  roundNumber: number;
  actingPlayerId: string;
  card: GameCard;
  sipsByPlayerId: Record<string, number>;
};

const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function mapBiernetToGameCard(card: BiernetCard): GameCard {
  const intensity: 1 | 2 | 3 = card.sipsMax <= 2 ? 1 : card.sipsMax <= 4 ? 2 : 3;
  return {
    id: card.id,
    type: "Rule",
    title: card.title,
    prompt: card.text,
    intensity,
  };
}

const DECK100_FIRST_38: GameCard[] = [
  { id: "bw_001", type: "Rule", title: "2 — Give a Sip", prompt: "Choose one person. They take 1 sip.", intensity: 1 },
  { id: "bw_002", type: "Rule", title: "3 — You Drink", prompt: "You take 1 sip.", intensity: 1 },
  { id: "bw_003", type: "Rule", title: "4 — Category", prompt: "Pick a category. Go around naming items; first to repeat or stall logs 1 sip.", intensity: 2 },
  { id: "bw_004", type: "Rule", title: "5 — Thumbs", prompt: "At any moment, put your thumb on the table. Everyone follows. Last thumb down logs 1 sip.", intensity: 2 },
  { id: "bw_005", type: "Rule", title: "6 — Drinking Buddy", prompt: "Choose a buddy. Whenever you drink, your buddy drinks too (until replaced).", intensity: 2 },
  { id: "bw_006", type: "Rule", title: "7 — Table of 7", prompt: "Count up. Multiples of 7 or numbers containing 7 are forbidden. Mistake = 1 sip.", intensity: 3 },
  { id: "bw_007", type: "Rule", title: "8 — Make a Rule", prompt: "Invent a rule for the rest of the game. Anyone breaking it logs 1 sip.", intensity: 2 },
  { id: "bw_008", type: "Rule", title: "9 — Remove a Rule", prompt: "Remove one existing rule (made by a previous 'Make a Rule').", intensity: 1 },
  { id: "bw_009", type: "Rule", title: "10 — Quizmaster", prompt: "Ask questions. Nobody may answer you. If they do: they log 1 sip. Only one Quizmaster at a time.", intensity: 2 },
  { id: "bw_010", type: "Wildcard", title: "Jack — Pointing", prompt: "Count down from 5. Everyone points at who should drink. Most votes logs 1 sip.", intensity: 2 },
  { id: "bw_011", type: "Wildcard", title: "Queen — Rise of the Queen", prompt: "At any time raise your hand and call 'Rise of the Queen!' Everyone follows. Last one logs 1 sip.", intensity: 2 },
  { id: "bw_012", type: "Rule", title: "King — King’s Cup", prompt: "Place the King on the cup/shot glass. Whoever places the 4th King takes the shot (or logs a big penalty).", intensity: 3 },
  { id: "bw_013", type: "Rule", title: "Ace — Reverse", prompt: "Reverse the direction of play.", intensity: 1 },
  { id: "bw_014", type: "Truth", title: "Hot Take Lite", prompt: "Say a mild hot take. Anyone who agrees logs 1 sip with you.", intensity: 1 },
  { id: "bw_015", type: "Truth", title: "First Impression", prompt: "Share your first impression of someone here (keep it friendly). If the room laughs, you log 1 sip.", intensity: 1 },
  { id: "bw_016", type: "Truth", title: "Guilty Pleasure", prompt: "Admit a guilty pleasure. If someone shares it, you both log 1 sip.", intensity: 1 },
  { id: "bw_017", type: "Truth", title: "Worst Purchase", prompt: "Confess the dumbest thing you’ve bought. Refuse = log 1 sip.", intensity: 1 },
  { id: "bw_018", type: "Truth", title: "Biggest Flex", prompt: "Drop a flex that sounds fake but is true. If nobody believes you, log 1 sip.", intensity: 2 },
  { id: "bw_019", type: "Truth", title: "Pet Peeve", prompt: "Name your biggest pet peeve. Anyone who says 'same' logs 1 sip with you.", intensity: 1 },
  { id: "bw_020", type: "Truth", title: "Villain Origin", prompt: "What tiny inconvenience would become your villain origin story? Best answer awards 1 sip.", intensity: 2 },
  { id: "bw_021", type: "Truth", title: "Procrastination Tax", prompt: "Name something you’ve been procrastinating. If you set a real deadline, you’re safe; if not, log 1 sip.", intensity: 2 },
  { id: "bw_022", type: "Dare", title: "15s Karaoke", prompt: "Sing 15 seconds of any song. No music needed. If you bail: log 1 sip.", intensity: 2 },
  { id: "bw_023", type: "Dare", title: "Infomercial", prompt: "Sell a random object in the room like an ad (15 seconds). Break character = log 1 sip.", intensity: 2 },
  { id: "bw_024", type: "Dare", title: "Impression (Nice)", prompt: "Do a harmless impression of someone here. If it’s too mean, you log 1 sip.", intensity: 2 },
  { id: "bw_025", type: "Dare", title: "Balance Check", prompt: "Stand on one foot for 10 seconds. Fail = log 1 sip.", intensity: 1 },
  { id: "bw_026", type: "Dare", title: "Tongue Twister", prompt: "Say a tongue twister 3 times fast. Miss once = log 1 sip.", intensity: 1 },
  { id: "bw_027", type: "Dare", title: "Handshake DLC", prompt: "Invent a handshake with the person to your right. If it’s unusable, you log 1 sip.", intensity: 2 },
  { id: "bw_028", type: "Dare", title: "Stand-Up Attempt", prompt: "Tell a quick joke. If nobody laughs, you log 1 sip.", intensity: 2 },
  { id: "bw_029", type: "Wildcard", title: "Rock Paper Sip", prompt: "Pick someone. One round of rock-paper-scissors. Loser logs 1 sip.", intensity: 1 },
  { id: "bw_030", type: "Wildcard", title: "Coin Flip", prompt: "Call heads/tails. Wrong call = log 1 sip.", intensity: 1 },
  { id: "bw_031", type: "Wildcard", title: "Lightning Vote", prompt: "Group votes: should the acting player log 1 sip? Majority rules.", intensity: 2 },
  { id: "bw_032", type: "Wildcard", title: "Seat Swap", prompt: "Swap seats with someone. If either of you complains, both log 1 sip.", intensity: 1 },
  { id: "bw_033", type: "Wildcard", title: "Pick Next Player", prompt: "Choose who goes next. If the group vetoes, you log 1 sip.", intensity: 1 },
  { id: "bw_034", type: "Wildcard", title: "Half the Room", prompt: "Pick a trait (e.g., wearing black). That group logs 1 sip.", intensity: 2 },
  { id: "bw_035", type: "Wildcard", title: "Two Truths One Lie", prompt: "Tell two truths and one lie. If nobody catches it, everyone else logs 1 sip.", intensity: 2 },
  { id: "bw_036", type: "Rule", title: "Phone Jail (2 Rounds)", prompt: "Phones face-down for 2 rounds. Touch your phone = log 1 sip.", intensity: 2 },
  { id: "bw_037", type: "Rule", title: "Non-Dominant Hand", prompt: "Drink with your non-dominant hand for 2 rounds. Slip up = log 1 sip.", intensity: 2 },
  { id: "bw_038", type: "Rule", title: "No Laughing (1 Round)", prompt: "For 1 round, you can’t laugh. Laugh = log 1 sip.", intensity: 3 },
];

export const BIERNET_DERIVED_62 = [
  { id: "bw_039", title: "Bussen — Round 1 (Red / Black)", text: "Use a real deck OR an online card draw. Dealer draws 1 card for the player: guess RED or BLACK. Correct → give 1 sip. Wrong → take 1 sip.", sipsMin: 1, sipsMax: 1, requires: ["cards"], source: "biernet" },
  { id: "bw_040", title: "Bussen — Round 2 (Higher / Lower)", text: "Use deck/online draw. Compare to your previous card from Round 1: guess HIGHER or LOWER. Correct → give 2 sips. Wrong → take 2 sips.", sipsMin: 2, sipsMax: 2, requires: ["cards"], source: "biernet" },
  { id: "bw_041", title: "Bussen — Round 3 (Inside / Outside)", text: "Use deck/online draw. You have 2 cards (from R1–R2). Guess INSIDE (between) or OUTSIDE. Correct → give 3 sips. Wrong → take 3 sips.", sipsMin: 3, sipsMax: 3, requires: ["cards"], source: "biernet" },
  { id: "bw_042", title: "Bussen — Round 4 (Same Suit?)", text: "Use deck/online draw. Guess SAME SUIT as one of your previous cards, or DIFFERENT. Correct → give 4 sips. Wrong → take 4 sips.", sipsMin: 4, sipsMax: 4, requires: ["cards"], source: "biernet" },
  { id: "bw_043", title: "Bussen — Pyramid", text: "Build a 5-row pyramid (5 cards on bottom). Flip from bottom up. If someone has that rank, they may place it and give sips equal to the row number (1–5).", sipsMin: 1, sipsMax: 5, requires: ["cards"], source: "biernet" },
  { id: "bw_044", title: "Bussen — The Bus", text: "Whoever has the most cards goes ‘in the bus’. Lay 8 face-up cards. For each position, guess the next card HIGHER/LOWER than the face-up card. First mistake → drink #positions progressed.", sipsMin: 1, sipsMax: 8, requires: ["cards"], source: "biernet" },
  { id: "bw_045", title: "In de Boot — Round 1 (Red / Black)", text: "Dealer draws 1 card for you (face-down). Guess RED or BLACK. Correct → give 1 sip. Wrong → take 1 sip.", sipsMin: 1, sipsMax: 1, requires: ["cards"], source: "biernet" },
  { id: "bw_046", title: "In de Boot — Round 2 (Higher / Lower)", text: "Dealer draws another card for you. Guess HIGHER or LOWER than your Round 1 card. Correct → give 2 sips. Wrong → take 2 sips.", sipsMin: 2, sipsMax: 2, requires: ["cards"], source: "biernet" },
  { id: "bw_047", title: "In de Boot — Round 3 (Inside / Outside)", text: "Dealer draws a 3rd card for you. Guess INSIDE or OUTSIDE your first two cards. Correct → give 3 sips. Wrong → take 3 sips.", sipsMin: 3, sipsMax: 3, requires: ["cards"], source: "biernet" },
  { id: "bw_048", title: "In de Boot — Round 4 (Suit)", text: "Dealer draws a 4th card for you. Guess the suit: ♥ ♦ ♣ ♠. Correct → give 4 sips. Wrong → take 4 sips.", sipsMin: 4, sipsMax: 4, requires: ["cards"], source: "biernet" },
  { id: "bw_049", title: "In de Boot — Final (The Boat)", text: "Finale: one player plays alone. They must guess: Red/Black → Higher/Lower → Inside/Outside → Suit. If ANY guess is wrong, restart from Red/Black and take 2 sips.", sipsMin: 2, sipsMax: 8, requires: ["cards"], source: "biernet" },
  { id: "bw_050", title: "Bierspel: 2 = Give 2", text: "Give away 2 sips (split however you want).", sipsMin: 0, sipsMax: 2, requires: ["none"], source: "biernet" },
  { id: "bw_051", title: "Bierspel: 3 = Give 3", text: "Give away 3 sips (split however you want).", sipsMin: 0, sipsMax: 3, requires: ["none"], source: "biernet" },
  { id: "bw_052", title: "Bierspel: 4 = Give 4", text: "Give away 4 sips (split however you want).", sipsMin: 0, sipsMax: 4, requires: ["none"], source: "biernet" },
  { id: "bw_053", title: "Bierspel: 5 = Give 5", text: "Give away 5 sips (split however you want).", sipsMin: 0, sipsMax: 5, requires: ["none"], source: "biernet" },
  { id: "bw_054", title: "Bierspel: 6 = Forbidden Word", text: "Pick a forbidden word for the next 5 minutes. Anyone who says it takes 4 sips.", sipsMin: 1, sipsMax: 4, requires: ["none"], source: "biernet" },
  { id: "bw_055", title: "Bierspel: 7 = Skip Sevens", text: "Counting mini-game: count up from 1. You may NOT say 7 or any multiple of 7. You must skip it (e.g., after 6 comes 8). First mistake takes 4 sips.", sipsMin: 2, sipsMax: 4, requires: ["none"], source: "biernet" },
  { id: "bw_056", title: "Bierspel: 8 = House Rule (light)", text: "Choose: either create a small rule OR reuse the last rule. First person to break a rule takes 3 sips.", sipsMin: 1, sipsMax: 3, requires: ["none"], source: "biernet" },
  { id: "bw_057", title: "Bierspel: 9 = You Drink", text: "You take 5 sips.", sipsMin: 5, sipsMax: 5, requires: ["none"], source: "biernet" },
  { id: "bw_058", title: "Bierspel: 10 = Make a Rule", text: "Make a rule. First person to break it takes 4 sips.", sipsMin: 1, sipsMax: 4, requires: ["none"], source: "biernet" },
  { id: "bw_059", title: "Bierspel: Jack = Thumb", text: "Thumb on table at any moment. Last one to copy takes 4 sips.", sipsMin: 2, sipsMax: 4, requires: ["none"], source: "biernet" },
  { id: "bw_060", title: "Bierspel: Queen = Bathroom Pass", text: "You get a bathroom pass. If you use it, you still take 2 sips first. If someone goes without a pass: 4 sips.", sipsMin: 0, sipsMax: 4, requires: ["none"], source: "biernet" },
  { id: "bw_061", title: "Bierspel: King = Question Trap", text: "Ask someone a question. If they answer, they take 3 sips. If they respond with a question instead, YOU take 3 sips.", sipsMin: 3, sipsMax: 3, requires: ["none"], source: "biernet" },
  { id: "bw_062", title: "Bierspel: Ace = Collect Aces", text: "Start/continue the Ace pile. When the 4th Ace appears, everyone takes 6 sips.", sipsMin: 1, sipsMax: 6, requires: ["none"], source: "biernet" },
  { id: "bw_063", title: "Aapje Gooien — Scoring", text: "Mini-game (2 dice): AAPJE (1+2) is highest and counts as 2 points. EVEN throws outrank ODD throws. (Example from Biernet: 6+5 = 65 is lower than 1+1 = 11).", sipsMin: 0, sipsMax: 0, requires: ["dice"], source: "biernet" },
  { id: "bw_064", title: "Aapje Gooien — Best of 3", text: "Everyone may roll up to 3 times and choose which final combo to keep. Highest gets 2 points if it’s an Aapje, others score 1, lowest drinks the sum of opponents’ points.", sipsMin: 2, sipsMax: 6, requires: ["dice"], source: "biernet" },
  { id: "bw_065", title: "Aapje Gooien — Aapje Tie-break", text: "If multiple people roll Aapje, those players re-roll to break the tie. Loser drinks extra (agree a sip amount; suggested +2).", sipsMin: 2, sipsMax: 4, requires: ["dice"], source: "biernet" },
  { id: "bw_066", title: "Driemannen — Who’s the Drieman?", text: "Roll 2 dice. If someone rolls 1 & 2, they become the Drieman. From now on, whenever ANYONE rolls a 3 on either die, the Drieman drinks 2 sips.", sipsMin: 2, sipsMax: 2, requires: ["dice"], source: "biernet" },
  { id: "bw_067", title: "Driemannen — Doubles Distribute", text: "If you roll doubles, you may give out sips equal to the die face (e.g., 5&5 → give 5 sips).", sipsMin: 0, sipsMax: 6, requires: ["dice"], source: "biernet" },
  { id: "bw_068", title: "Dobbelen — Roll Now", text: "Roll 1 die (real or app). On 1: you take 6 sips and roll again. On 3: you take 6 sips. On 6: pick someone to take 6 sips.", sipsMin: 0, sipsMax: 6, requires: ["dice"], source: "biernet" },
  { id: "bw_069", title: "Dobbelen — Off the Table", text: "If the die falls off the table: take 4 sips.", sipsMin: 4, sipsMax: 4, requires: ["dice"], source: "biernet" },
  { id: "bw_070", title: "Dobbelen — Triple Repeat", text: "If the SAME number is rolled 3 times in a row (track it): everyone takes 4 sips.", sipsMin: 4, sipsMax: 4, requires: ["dice"], source: "biernet" },
  { id: "bw_071", title: "Harry! — Base Rules", text: "For the next 10 minutes: (1) Everyone is called ‘Harry’. (2) No pointing. Break either rule → 3 sips.", sipsMin: 3, sipsMax: 3, requires: ["dice"], source: "biernet" },
  { id: "bw_072", title: "Harry! — Roll 1", text: "Roll a die. If you roll 1: invent a new rule. First breaker takes 3 sips.", sipsMin: 1, sipsMax: 3, requires: ["dice"], source: "biernet" },
  { id: "bw_073", title: "Harry! — Roll 2", text: "Roll a die. If you roll 2: delete one active rule (your choice).", sipsMin: 0, sipsMax: 0, requires: ["dice"], source: "biernet" },
  { id: "bw_074", title: "Harry! — Rolls 3/4/5", text: "Roll a die. 3 → left drinks 2 sips. 4 → right drinks 2 sips. 5 → you drink 2 sips.", sipsMin: 2, sipsMax: 2, requires: ["dice"], source: "biernet" },
  { id: "bw_075", title: "Harry! — Roll 6 (Quiz Master)", text: "Roll a die. If you roll 6: you’re Quiz Master until someone else rolls 6. Nobody may answer your questions; if they do, they take 3 sips.", sipsMin: 1, sipsMax: 3, requires: ["dice"], source: "biernet" },
  { id: "bw_076", title: "Bottle Caps — Both Logo DOWN", text: "Flip 2 bottle caps. If BOTH land logo/brand DOWN: you drink 2 sips.", sipsMin: 2, sipsMax: 2, requires: ["bottleCaps"], source: "biernet" },
  { id: "bw_077", title: "Bottle Caps — Both Logo UP", text: "Flip 2 bottle caps. If BOTH land logo/brand UP: choose someone to drink 2 sips.", sipsMin: 0, sipsMax: 2, requires: ["bottleCaps"], source: "biernet" },
  { id: "bw_078", title: "Bottle Caps — One Up / One Down", text: "Flip 2 bottle caps. If one is UP and one is DOWN: create a rule OR remove a rule. Next rule-breaker drinks 3 sips.", sipsMin: 1, sipsMax: 3, requires: ["bottleCaps"], source: "biernet" },
  { id: "bw_079", title: "Hoger Lager — Guess", text: "Use deck/online draw. One card is face-up. Guess if the next card is HIGHER or LOWER. Wrong → take 2 sips. Correct → no sips.", sipsMin: 0, sipsMax: 2, requires: ["cards"], source: "biernet" },
  { id: "bw_080", title: "Hoger Lager — Same Card = Double", text: "If the next card is EXACTLY the same rank as the face-up card: take 4 sips.", sipsMin: 4, sipsMax: 4, requires: ["cards"], source: "biernet" },
  { id: "bw_081", title: "Mexxen II — How scoring works", text: "2 dice: highest die is the tens, lowest is the ones (4 & 6 → 64). Doubles become hundreds (1&1=100, 2&2=200, …). Highest is Mexx: 1 & 2 = 21.", sipsMin: 0, sipsMax: 0, requires: ["dice"], source: "biernet" },
  { id: "bw_082", title: "Mexxen II — Bluff or Believe", text: "Player rolls hidden (cup optional), announces a number. Next player either BELIEVES and must roll higher, or CALLS BLUFF. Wrong caller drinks 4 sips; caught bluffer drinks 4 sips.", sipsMin: 4, sipsMax: 4, requires: ["dice"], source: "biernet" },
  { id: "bw_083", title: "Mexxen II — Hidden 1 Trick", text: "If you secretly roll a 1, you may keep it under the cup and re-roll the other die up to 2 times to try for a 2 (to make Mexx = 21). If you fail, you can still bluff—but risk the call.", sipsMin: 1, sipsMax: 4, requires: ["dice"], source: "biernet" },
  { id: "bw_084", title: "99 — Core Rule", text: "Mini-game: everyone holds 4 cards. Play 1 card, add its value to a running total. If YOU push the total past 99, you take 6 sips.", sipsMin: 6, sipsMax: 6, requires: ["cards"], source: "biernet" },
  { id: "bw_085", title: "99 — 4 = Skip (Total stays)", text: "In 99: playing a 4 skips the next player and the total does NOT change.", sipsMin: 0, sipsMax: 0, requires: ["cards"], source: "biernet" },
  { id: "bw_086", title: "99 — 10 = +10 or -10", text: "In 99: playing a 10 lets you choose +10 or -10 to the running total.", sipsMin: 0, sipsMax: 0, requires: ["cards"], source: "biernet" },
  { id: "bw_087", title: "99 — King (Heer) = Pick a Victim", text: "In 99: playing a King (Heer) lets you choose someone to take a drink (agree: 3 sips). If they answer with a King back later, you can get targeted too.", sipsMin: 0, sipsMax: 3, requires: ["cards"], source: "biernet" },
  { id: "bw_088", title: "Bieramide — Setup", text: "Each player gets 4 cards. Build a 5-row pyramid face-down (5 on bottom to 1 on top). Everyone gets 5 seconds to peek at their 4 cards, then put them back face-down in the same order.", sipsMin: 0, sipsMax: 0, requires: ["cards"], source: "biernet" },
  { id: "bw_089", title: "Bieramide — Call a Card (Bluff allowed)", text: "Flip pyramid cards from bottom up. If you THINK you have the flipped rank (bluff allowed), point at someone and claim it. They must choose: BELIEVE or CHALLENGE.", sipsMin: 0, sipsMax: 0, requires: ["cards"], source: "biernet" },
  { id: "bw_090", title: "Bieramide — Believe", text: "If they BELIEVE you: they drink sips equal to the pyramid row (bottom=1 up to top=5).", sipsMin: 1, sipsMax: 5, requires: ["cards"], source: "biernet" },
  { id: "bw_091", title: "Bieramide — Challenge (Double or Nothing)", text: "If they CHALLENGE: reveal your card. If you bluffed → YOU drink DOUBLE row sips. If you were truthful → CHALLENGER drinks DOUBLE row sips.", sipsMin: 2, sipsMax: 10, requires: ["cards"], source: "biernet" },
  { id: "bw_092", title: "Kamelenrace — Pick an Ace & Bet", text: "Pick an Ace (♠♥♦♣) as your camel and bet a sip amount (group sets min/max).", sipsMin: 1, sipsMax: 5, requires: ["cards"], source: "biernet" },
  { id: "bw_093", title: "Kamelenrace — Move Your Camel", text: "Reveal cards from the deck. When a suit appears, that Ace moves forward one step. First Ace to the finish gives out sips increasing from 1 up to 10 over time (agree pacing).", sipsMin: 1, sipsMax: 10, requires: ["cards"], source: "biernet" },
  { id: "bw_094", title: "Kamelenrace — Circle Flip (Half Bet)", text: "After each Ace has advanced once, flip the next ‘circle’ card: if it matches a suit, that Ace moves back 1 and drinks HALF their bet (rounded up).", sipsMin: 1, sipsMax: 5, requires: ["cards"], source: "biernet" },
  { id: "bw_095", title: "Kamelenrace — Ace hits Joker", text: "If an Ace reaches the Joker finish first, that player may DOUBLE their bet and distribute it across the table.", sipsMin: 2, sipsMax: 10, requires: ["cards"], source: "biernet" },
  { id: "bw_096", title: "Juffen — JUF & Reverse", text: "Counting mini-game: count upward. If the number contains a 7 OR is a multiple of 7, you must say “JUF” and reverse direction. If you hesitate or say the number: take 5 sips.", sipsMin: 5, sipsMax: 5, requires: ["none"], source: "biernet" },
  { id: "bw_097", title: "A-relaxte Telspel — Race to 21", text: "Count from 1 to 21. On your turn you may say 1–3 consecutive numbers. Whoever says 21 takes 5 sips.", sipsMin: 5, sipsMax: 5, requires: ["none"], source: "biernet" },
  { id: "bw_098", title: "A-relaxte Telspel — ‘Circled numbers’ variant", text: "Variant: numbers with a ‘circle’ are doubled (6,9,10,16,19,20 twice; 8 and 18 four times). Mess it up → 4 sips.", sipsMin: 4, sipsMax: 4, requires: ["none"], source: "biernet" },
  { id: "bw_099", title: "Trivianten — Fastest Hand", text: "Put a bottle cap in the middle. Open any trivia site/app. Quizmaster reads a question; whoever slaps the cap first answers.", sipsMin: 0, sipsMax: 0, requires: ["bottleCaps", "phone"], source: "biernet" },
  { id: "bw_100", title: "Trivianten — Correct / Wrong", text: "If you answer correctly: give 2 sips. If wrong: take 2 sips.", sipsMin: 2, sipsMax: 2, requires: ["bottleCaps", "phone"], source: "biernet" },
] as const satisfies readonly BiernetCard[];

const FULL_DECK: GameCard[] = [
  ...DECK100_FIRST_38,
  ...BIERNET_DERIVED_62.map(mapBiernetToGameCard),
];

function pickRandomCard(deck: GameCard[]) {
  return deck[Math.floor(Math.random() * deck.length)];
}
type RoleCtor = new () => import("./roles/BaseRole").BaseRole;


const ROLE_POOL: RoleCtor[] = [
  Berserker,
  Trickster,
  Lightweight,
  Tank,
  SocialButterfly,
  Gremlin,
  Lawyer,
  Cleric,
  TimeTraveler,
  Bartender,
];

type Assigned = { player: EnginePlayer; role: import("./roles/BaseRole").BaseRole };

function createGameState(): { engine: GameEngine; assignments: Assigned[] } {
  const engine = new GameEngine(new ConsoleLogger("PourDecisions"), new DefaultRandomProvider(), new EffectResolver());
  const players = ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5"].map((name, idx) => new EnginePlayer(`p${idx + 1}`, name));
  const roleCtors = engine.random.shuffle([...ROLE_POOL]).slice(0, 5);
  const assignments = players.map((p, i) => {
    const role = new roleCtors[i]();
    engine.registerPlayer(p, role);
    return { player: p, role };
  });
  return { engine, assignments };
}

export default function DrinkingGamesPlatformUI() {
  const [{ engine, assignments }, setGame] = useState(() => createGameState());
  const [roundNumber, setRoundNumber] = useState(1);
  const [actingPlayerIdx, setActingPlayerIdx] = useState(0);
  const [currentCard, setCurrentCard] = useState<GameCard>(() => pickRandomCard(FULL_DECK));
  const [pendingSipsByPlayerId, setPendingSipsByPlayerId] = useState<Record<string, number>>(() =>
    Object.fromEntries(assignments.map((a) => [a.player.id, 0]))
  );

  const players = assignments.map((a) => a.player);

  function setPendingSip(playerId: string, value: number) {
    setPendingSipsByPlayerId((prev) => ({ ...prev, [playerId]: clamp(value, 0, 99) }));
  }

  function resetGame() {
    const fresh = createGameState();
    setGame(fresh);
    setRoundNumber(1);
    setActingPlayerIdx(0);
    setCurrentCard(pickRandomCard(FULL_DECK));
    setPendingSipsByPlayerId(Object.fromEntries(fresh.assignments.map((a) => [a.player.id, 0])));
  }

  function nextRandomTurnIdx(currentIdx: number): number {
    if (players.length <= 1) return 0;
    let idx = currentIdx;
    while (idx === currentIdx) idx = engine.random.nextInt(0, players.length - 1);
    return idx;
  }

  function turnCard() {
    const acting = players[actingPlayerIdx];
    for (const [pid, sips] of Object.entries(pendingSipsByPlayerId)) {
      if (sips > 0) {
        engine.getPlayer(pid).addDrinks(sips);
      }
    }
    engine.logger.info("Turn resolved", { roundNumber, actingPlayer: acting.name, card: currentCard.id });
    setRoundNumber((r) => r + 1);
    setActingPlayerIdx((idx) => nextRandomTurnIdx(idx));
    setCurrentCard(pickRandomCard(FULL_DECK));
    setPendingSipsByPlayerId(Object.fromEntries(players.map((p) => [p.id, 0])));
  }

  function usePowerUp(playerId: string) {
    const role = engine.getRole(playerId);
    const player = engine.getPlayer(playerId);
    const effects = role.usePowerUp(engine.makeRoleContext(player));
    engine.resolveEffects(effects, { sourcePlayer: player, engine, logger: engine.logger });
    setRoundNumber((r) => r);
  }

  function usePowerDown(playerId: string) {
    const role = engine.getRole(playerId);
    const player = engine.getPlayer(playerId);
    const effects = role.triggerPowerDown(engine.makeRoleContext(player));
    engine.resolveEffects(effects, { sourcePlayer: player, engine, logger: engine.logger });
    setRoundNumber((r) => r);
  }

  const totals = useMemo(() => Object.fromEntries(players.map((p) => [p.id, engine.getPlayer(p.id).drinkCount])), [players, engine, roundNumber]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-3xl font-black">🍻 Pour-Decisions</h1>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/70">Round {roundNumber}</div>
          <div className="text-lg font-bold">Acting player: {players[actingPlayerIdx].name}</div>
          <div className="mt-2 text-xs text-emerald-300">No swiping — just turn cards. Turns are random each round.</div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {assignments.map((a) => (
            <div key={a.player.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="font-bold">{a.player.name}</div>
              <div className="text-sm text-sky-300">Class: {a.role.name}</div>
              <div className="mt-1 text-xs text-white/70">{a.role.description}</div>
              <div className="mt-2 text-xs text-white/80">Power Up: Trigger class active ability.</div>
              <div className="text-xs text-white/80">Power Down: Trigger class drawback.</div>
              <div className="mt-2 flex gap-2">
                <button className="rounded-lg bg-sky-500 px-2 py-1 text-xs font-semibold" onClick={() => usePowerUp(a.player.id)}>Power Up</button>
                <button className="rounded-lg bg-rose-500 px-2 py-1 text-xs font-semibold" onClick={() => usePowerDown(a.player.id)}>Power Down</button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/70">{currentCard.type}</div>
          <div className="text-xl font-extrabold">{currentCard.title}</div>
          <p className="mt-2 text-sm text-white/80">{currentCard.prompt}</p>
          <button onClick={turnCard} className="mt-4 rounded-xl bg-white px-4 py-2 font-semibold text-slate-900">Turn card</button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-sm font-bold">Round sips</div>
          {players.map((p) => (
            <div key={p.id} className="mb-2 flex items-center justify-between gap-2">
              <span>{p.name}</span>
              <input className="w-20 rounded-lg bg-white/10 px-2 py-1" inputMode="numeric" value={pendingSipsByPlayerId[p.id] ?? 0} onChange={(e) => setPendingSip(p.id, Number(e.target.value.replace(/[^\d]/g, "")) || 0)} />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-sm font-bold">Leaderboard</div>
          {players.map((p) => (
            <div key={p.id} className="flex justify-between text-sm"><span>{p.name}</span><span>{totals[p.id] ?? 0} sips</span></div>
          ))}
          <div className="mt-3 text-xs text-white/60">Deck loaded: {FULL_DECK.length} cards (first 38 + Biernet 62).</div>
          <button onClick={resetGame} className="mt-3 rounded-xl bg-white/20 px-3 py-2 text-sm">New game (reassign classes)</button>
        </div>
      </div>
    </div>
  );
}
