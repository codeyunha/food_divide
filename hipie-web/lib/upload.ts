// Supabase Storage 업로드 키 생성 유틸
// 원본 파일명(한글 등 비ASCII 포함 가능)을 키에 그대로 쓰면 업로드가 거부되므로,
// 파일명은 버리고 "안전한 확장자"만 사용해 ASCII 전용 키를 만든다.

export function fileExtension(file: File): string {
  // 1) 파일명 끝의 확장자에서 영숫자만 추출
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  const cleanName = fromName.replace(/[^a-z0-9]/g, "");
  if (cleanName.length >= 1 && cleanName.length <= 5) return cleanName;

  // 2) 확장자가 없거나 이상하면 MIME 타입에서 폴백 (예: image/jpeg -> jpeg)
  const fromType = file.type.split("/").pop()?.toLowerCase() ?? "";
  const cleanType = fromType.replace(/[^a-z0-9]/g, "");
  return cleanType || "bin";
}

/**
 * 안전한 스토리지 키 생성.
 * 예) `${userId}/1737000000000-2-a1b2c3.jpg`
 * @param prefix 보통 `user.id` (버킷 내 폴더)
 * @param file   업로드할 파일
 * @param index  여러 파일 동시 업로드 시 구분용(선택)
 */
export function makeStorageKey(
  prefix: string,
  file: File,
  index?: number
): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const suffix = index != null ? `-${index}` : "";
  return `${prefix}/${Date.now()}${suffix}-${rand}.${fileExtension(file)}`;
}
