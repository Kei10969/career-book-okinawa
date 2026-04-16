export type UserType = 'individual' | 'company'
export type RequestType = 'support' | 'subcontract'
export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export type Trade =
  | '鳶工' | '型枠工' | '鉄筋工' | '大工' | '左官' | '塗装工'
  | '防水工' | '電気工事' | '配管工事' | '設備工事' | '内装工事'
  | '解体工事' | '土木作業' | 'クレーン' | '重機オペ' | 'その他'

export type OkinawaCity =
  | '那覇市' | '浦添市' | '宜野湾市' | '沖縄市' | 'うるま市'
  | '名護市' | '糸満市' | '豊見城市' | '南城市' | '読谷村'
  | '嘉手納町' | '北谷町' | '北中城村' | '中城村' | '西原町'
  | '与那原町' | '南風原町' | '八重瀬町' | '大宜味村' | '国頭村'
  | '東村' | '今帰仁村' | '本部町' | '恩納村'

export interface User {
  id: string
  line_id: string | null
  display_name: string
  avatar_url: string | null
  type: UserType
  company_name: string | null
  skills: Trade[]
  areas: OkinawaCity[]
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Request {
  id: string
  user_id: string
  type: RequestType
  title: string
  description: string
  area: OkinawaCity
  trade: Trade
  period_start: string
  period_end: string
  daily_rate: number | null
  headcount: number | null
  is_urgent: boolean
  status: 'open' | 'closed'
  created_at: string
  updated_at: string
  user?: User
  applications?: Application[]
  _count?: { applications: number }
}

export interface Application {
  id: string
  request_id: string
  applicant_id: string
  message: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
  request?: Request
  applicant?: User
}

export interface Notification {
  id: string
  user_id: string
  type: 'new_application' | 'application_approved' | 'application_rejected' | 'new_request'
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: {
          id?: string
          line_id?: string | null
          display_name: string
          avatar_url?: string | null
          type?: UserType
          company_name?: string | null
          skills?: string[]
          areas?: string[]
          bio?: string | null
        }
        Update: {
          id?: string
          line_id?: string | null
          display_name?: string
          avatar_url?: string | null
          type?: UserType
          company_name?: string | null
          skills?: string[]
          areas?: string[]
          bio?: string | null
        }
      }
      requests: {
        Row: Request
        Insert: {
          id?: string
          user_id: string
          type: RequestType
          title: string
          description: string
          area: string
          trade: string
          period_start: string
          period_end: string
          daily_rate?: number | null
          headcount?: number | null
          is_urgent?: boolean
          status?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: RequestType
          title?: string
          description?: string
          area?: string
          trade?: string
          period_start?: string
          period_end?: string
          daily_rate?: number | null
          headcount?: number | null
          is_urgent?: boolean
          status?: string
        }
      }
      applications: {
        Row: Application
        Insert: {
          id?: string
          request_id: string
          applicant_id: string
          message?: string
          status?: ApplicationStatus
        }
        Update: {
          id?: string
          request_id?: string
          applicant_id?: string
          message?: string
          status?: ApplicationStatus
        }
      }
      notifications: {
        Row: Notification
        Insert: {
          id?: string
          user_id: string
          type: 'new_application' | 'application_approved' | 'application_rejected' | 'new_request'
          title: string
          message: string
          link?: string | null
          is_read?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'new_application' | 'application_approved' | 'application_rejected' | 'new_request'
          title?: string
          message?: string
          link?: string | null
          is_read?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
