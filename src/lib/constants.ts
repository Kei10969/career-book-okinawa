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

export const QUALIFICATIONS = [
  '1級建築施工管理技士', '2級建築施工管理技士',
  '1級土木施工管理技士', '2級土木施工管理技士',
  '玉掛け技能講習', '足場の組立て等作業主任者',
  'クレーン運転士', '移動式クレーン運転士',
  'フォークリフト運転技能者', '車両系建設機械運転者',
  '酸素欠乏危険作業主任者', '有機溶剤作業主任者',
  '電気工事士（第一種）', '電気工事士（第二種）',
  '配管技能士', '溶接技能者',
  'その他'
] as const

export const EXPERIENCE_YEARS = [
  '1年未満', '1〜3年', '3〜5年', '5〜10年', '10〜20年', '20年以上'
] as const

export const DESIRED_SALARY = [
  '12,000円/日以上', '15,000円/日以上', '18,000円/日以上',
  '20,000円/日以上', '25,000円/日以上', '30,000円/日以上',
  '応相談'
] as const

export const JOB_STATUS = [
  { value: 'immediate', label: '今すぐ転職希望' },
  { value: 'considering', label: '良い案件があれば検討' },
  { value: 'not_looking', label: '今は探していない' },
] as const

export const JOB_STATUS_LABEL: Record<string, string> = {
  immediate: '今すぐ転職希望',
  considering: '良い案件があれば検討',
  not_looking: '今は探していない',
}

export const APPROACH_STATUS_LABEL: Record<string, string> = {
  pending: 'アプローチ中',
  accepted: '承諾',
  rejected: '辞退',
}

export const BUSINESS_TYPES = [
  '総合建設業（ゼネコン）',
  '土木工事業',
  '建築工事業',
  '電気工事業',
  '管工事業',
  '鉄筋工事業',
  '型枠工事業',
  '足場・鳶工事業',
  '塗装工事業',
  '防水工事業',
  '内装仕上工事業',
  '左官工事業',
  '解体工事業',
  '設備工事業',
  'リフォーム・リノベーション',
  '不動産業',
  'その他',
] as const
