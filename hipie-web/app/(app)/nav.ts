export type NavItem = { href: string; label: string; icon: string };

export const NAV: NavItem[] = [
  { href: "/home", label: "홈", icon: "🏠" },
  { href: "/dish", label: "완제품 파티", icon: "🍲" },
  { href: "/ingredient", label: "재료 파티", icon: "🥬" },
  { href: "/recipes", label: "레시피", icon: "🍳" },
  { href: "/favorites", label: "파티 찜하기", icon: "❤️" },
  { href: "/my", label: "내 파티 목록", icon: "📋" },
  { href: "/community", label: "커뮤니티", icon: "💬" },
  { href: "/profile", label: "프로필", icon: "👤" },
];
