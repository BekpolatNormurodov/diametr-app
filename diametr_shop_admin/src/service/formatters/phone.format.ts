export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, ""); // faqat raqamlarni olib qolamiz

  if (digits.length !== 12 || !digits.startsWith("998")) {
    return phone; // noto'g'ri format bo'lsa, qaytaramiz o'zini
  }

  const code = digits.slice(0, 3); // 998
  const operator = digits.slice(3, 5); // 99
  const part1 = digits.slice(5, 8); // 020
  const part2 = digits.slice(8, 10); // 16
  const part3 = digits.slice(10, 12); // 17

  return `+${code} (${operator}) ${part1} ${part2} ${part3}`;
};

// Foydalanish:
const phone = "+998990201617";
console.log(formatPhoneNumber(phone)); // +998 (99) 020 16 17
