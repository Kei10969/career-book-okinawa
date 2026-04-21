export const TRADES = [
  '鳶工', '型枠工', '鉄筋工', '大工', '左官', '塗装工',
  '防水工', '電気工事', '配管工事', '設備工事', '内装工事',
  '解体工事', '土木作業', 'クレーン', '重機オペ', 'その他'
] as const

export const OKINAWA_CITIES = [
  '那覇市', '浦添市', '宜野湾市', '沖縄市', 'うるま市',
  '名護市', '糸満市', '豊見城市', '南城市', '読谷村',
  '嘉手納町', '北谷町', '北中城村', '中城村', '西原町',
  '与那原町', '南風原町', '八重瀬町', '大宜味村', '国頭村',
  '東村', '今帰仁村', '本部町', '恩納村'
] as const

export const REQUEST_TYPE_LABEL: Record<string, string> = {
  support: '応援',
  subcontract: '下請け',
}

export const REQUEST_TYPE_COLOR: Record<string, string> = {
  support: 'bg-orange-100 text-orange-700',
  subcontract: 'bg-blue-100 text-blue-700',
}

export const APPLICATION_STATUS_LABEL: Record<string, string> = {
  pending: '申請中',
  approved: '成立',
  rejected: '却下',
}

export const OFFER_STATUS_LABEL: Record<string, string> = {
  open: '募集中',
  reviewing: '審査中',
  matched: '成立',
  closed: '終了',
}
