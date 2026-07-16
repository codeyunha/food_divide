export type PartyType = "finished" | "ingredient";
export type PartyStatus = "recruiting" | "closed" | "done";

export type Profile = {
  id: string;
  nickname: string;
  avatar_url: string | null;
  manner_score: number;
};

export type Party = {
  id: string;
  host_id: string;
  type: PartyType;
  title: string;
  photos: string[];
  receipt_photo: string;
  tags: string[];
  price: number;
  expiry_date: string;
  total_amount: string;
  description: string | null;
  capacity: number | null;
  status: PartyStatus;
  created_at: string;
  host?: Profile | null;
  member_count?: number;
};

export type Recipe = {
  id: string;
  name: string;
  category: string | null;
  cooking_way: string | null;
  ingredients: string | null;
  ingredient_tokens: string[] | null;
  hash_tag: string | null;
  main_image: string | null;
  na_tip: string | null;
  info_eng: number | null;
  info_car: number | null;
  info_pro: number | null;
  info_fat: number | null;
  info_na: number | null;
  manuals: { step: number; text: string; img: string }[] | null;
};

export type Message = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile | null;
};
