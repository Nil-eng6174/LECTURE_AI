export type LectureStatus = "completed" | "processing" | "failed";

export type TimelineEvent = {
  timestamp: number;
  label: string;
  description: string;
};

export type TranscriptSegment = {
  id: string;
  startTime: number;
  endTime: number;
  speaker: string;
  text: string;
};

export type LectureAnalysis = {
  summary: string;
  topics: string[];
  keyConcepts: string[];
  importantPoints: string[];
  assignments: Array<{ description: string; timestamp: number; deadline: string | null }>;
  announcements: Array<{ description: string; timestamp: number }>;
  questions: string[];
  importantDates: string[];
};

export type LectureRecord = {
  id: string;
  userId: number | null;
  title: string;
  subject: string;
  professor: string;
  lectureDate: string;
  duration: number;
  status: LectureStatus;
  createdAt: string;
  isDemo?: boolean;
  topics: string[];
  transcript: TranscriptSegment[];
  timeline: TimelineEvent[];
  analysis: LectureAnalysis;
};

export const demoLecture: LectureRecord = {
  id: "demo-trees-and-graphs",
  userId: null,
  title: "Trees & Graphs: Building Better Search",
  subject: "Data Structures",
  professor: "Dr. Maya Chen",
  lectureDate: "2026-09-10",
  duration: 52,
  status: "completed",
  createdAt: "2026-09-10T12:00:00.000Z",
  isDemo: true,
  topics: ["Binary Search Trees", "AVL Trees", "Rotations", "Complexity"],
  timeline: [
    { timestamp: 0, label: "Warm up", description: "Why tree structure changes the cost of search." },
    { timestamp: 522, label: "BST insertion", description: "Walking through insertion and ordering invariants." },
    { timestamp: 931, label: "Deletion", description: "The three deletion cases and successor replacement." },
    { timestamp: 1630, label: "AVL rotations", description: "Balancing a tree with LL, RR, LR and RL rotations." },
    { timestamp: 2325, label: "Assignment", description: "Implement insertion and deletion for a BST." },
  ],
  transcript: [
    { id: "s1", startTime: 0, endTime: 106, speaker: "Professor", text: "Today we are connecting the shape of a tree to the time it takes to search. A balanced tree gives us a much more predictable experience." },
    { id: "s2", startTime: 106, endTime: 522, speaker: "Professor", text: "A binary search tree keeps smaller values to the left and larger values to the right. That ordering is the invariant every operation must preserve." },
    { id: "s3", startTime: 522, endTime: 931, speaker: "Professor", text: "For insertion, compare from the root and follow the appropriate child until you find an empty position. In the average case this is logarithmic, but a skewed tree can degrade to linear time." },
    { id: "s4", startTime: 931, endTime: 1180, speaker: "Professor", text: "Deletion has three cases: a leaf, a node with one child, or a node with two children. For the last case, replace the node with its in-order successor." },
    { id: "s5", startTime: 1180, endTime: 1630, speaker: "Professor", text: "The important thing is not just memorizing the cases. Trace the links carefully, then verify that the ordering invariant still holds." },
    { id: "s6", startTime: 1630, endTime: 2050, speaker: "Professor", text: "AVL trees keep the height difference between left and right subtrees within one. When that balance is violated, rotations restore the invariant without losing sorted order." },
    { id: "s7", startTime: 2050, endTime: 2325, speaker: "Professor", text: "You should recognize LL, RR, LR and RL patterns. Draw the local three-node picture before choosing the rotation." },
    { id: "s8", startTime: 2325, endTime: 2500, speaker: "Professor", text: "For homework, implement insertion and deletion for a binary search tree and include tests for all three deletion cases. Bring questions to the next tutorial." },
    { id: "s9", startTime: 2500, endTime: 3120, speaker: "Professor", text: "Next time we will compare AVL trees with red-black trees and talk about when strict balancing is worth the extra work." },
  ],
  analysis: {
    summary: "This lecture explains how binary search trees organize data, how insertion and deletion preserve their ordering invariant, and why AVL rotations are useful for keeping search performance predictable. The class closes with a practical BST implementation assignment.",
    topics: ["Binary search tree invariants", "Insertion and deletion", "In-order successor", "AVL balance factor", "LL, RR, LR and RL rotations"],
    keyConcepts: ["Average BST search is logarithmic, but a skewed tree can become linear", "Two-child deletion uses the in-order successor", "AVL balance is maintained with local rotations"],
    importantPoints: ["Always preserve sorted order after mutations", "Deletion requires three distinct cases", "Draw the local tree shape before selecting a rotation"],
    assignments: [{ description: "Implement insertion and deletion for a binary search tree, with tests for all three deletion cases.", timestamp: 2325, deadline: null }],
    announcements: [{ description: "Bring questions from the BST implementation to the next tutorial.", timestamp: 2325 }],
    questions: ["Why can a BST degrade to linear time?", "How do you choose between LL, RR, LR and RL rotations?", "Why is the in-order successor useful during deletion?"],
    importantDates: [],
  },
};

const uploadedLectures: LectureRecord[] = [];

export function listLectures(userId?: number | null): LectureRecord[] {
  if (userId) return uploadedLectures.filter((lecture) => lecture.userId === userId);
  return [demoLecture];
}

export function getLecture(id: string, userId?: number | null): LectureRecord | undefined {
  if (id === demoLecture.id) return demoLecture;
  return listLectures(userId).find((lecture) => lecture.id === id);
}

export function addLecture(lecture: LectureRecord) {
  uploadedLectures.unshift(lecture);
  return lecture;
}

export function formatTimestamp(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function searchLectures(query: string, userId?: number | null) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return listLectures(userId).flatMap((lecture) => {
    const matches = lecture.transcript.filter((segment) => segment.text.toLowerCase().includes(normalized));
    return matches.slice(0, 4).map((segment) => ({
      lectureId: lecture.id,
      lectureTitle: lecture.title,
      timestamp: segment.startTime,
      context: segment.text,
    }));
  });
}
