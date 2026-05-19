export interface Message {
  id: string
  role: 'interviewer' | 'candidate'
  content: string
  timestamp: Date
}
