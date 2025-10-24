export const PREFECTURES = [
  '北海道',
  '青森県',
  '岩手県',
  '宮城県',
  '秋田県',
  '山形県',
  '福島県',
  '茨城県',
  '栃木県',
  '群馬県',
  '埼玉県',
  '千葉県',
  '東京都',
  '神奈川県',
  '新潟県',
  '富山県',
  '石川県',
  '福井県',
  '山梨県',
  '長野県',
  '岐阜県',
  '静岡県',
  '愛知県',
  '三重県',
  '滋賀県',
  '京都府',
  '大阪府',
  '兵庫県',
  '奈良県',
  '和歌山県',
  '鳥取県',
  '島根県',
  '岡山県',
  '広島県',
  '山口県',
  '徳島県',
  '香川県',
  '愛媛県',
  '高知県',
  '福岡県',
  '佐賀県',
  '長崎県',
  '熊本県',
  '大分県',
  '宮崎県',
  '鹿児島県',
  '沖縄県',
];

export const REVIEW_CATEGORIES = [
  { value: 'store_health', label: '店舗型ヘルス' },
  { value: 'delivery_health', label: '出張型ヘルス' },
  { value: 'soap', label: 'ソープ' },
  { value: 'dc', label: 'デリヘル (DC)' },
  { value: 'pinsaro', label: 'ピンサロ' },
] as const;

export const AVERAGE_EARNING_OPTIONS = Array.from({ length: 21 }, (_, index) => ({
  label: `${index}万円`,
  value: index,
}));

export const SPEC_OPTIONS = [
  { label: '80未満', value: 70 },
  { label: '80', value: 80 },
  { label: '90', value: 90 },
  { label: '100', value: 100 },
  { label: '110', value: 110 },
  { label: '120', value: 120 },
  { label: '120以上', value: 130 },
];

export const WAIT_TIME_OPTIONS = Array.from({ length: 24 }, (_, index) => {
  const value = index + 1;
  return { label: `${value}時間`, value };
});

export const AGE_OPTIONS = Array.from({ length: 43 }, (_, index) => {
  const value = index + 18;
  return { label: `${value}歳`, value };
});
