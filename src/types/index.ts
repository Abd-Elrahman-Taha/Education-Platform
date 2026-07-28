export type AppView =
  | 'view-landing'
  | 'view-drm-player'
  | 'view-assessment'
  | 'view-parent-portal'
  | 'view-community'
  | 'view-admin';

export interface Course {
  id: string;
  title: string;
  category: string;
  level: string;
  instructor: {
    name: string;
    avatar: string;
    role: string;
  };
  duration: string;
  lessonsCount: number;
  examsCount: number;
  rating: number;
  studentsCount: number;
  price: string;
  image: string;
  tag: string;
}

export interface Question {
  id: number;
  text: string;
  options: { key: string; label: string }[];
  correctAnswer: string;
  explanation: string;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  timeAgo: string;
  subject: string;
  title: string;
  content: string;
  upvotes: number;
  repliesCount: number;
  isSolved: boolean;
}

export interface RosterStudent {
  id: string;
  code: string;
  name: string;
  phone: string;
  parentPhone: string;
  grade: string;
  attendance: string;
  averageScore: number;
  status: 'active' | 'blocked';
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}
