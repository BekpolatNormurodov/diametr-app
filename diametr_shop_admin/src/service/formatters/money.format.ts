export const formatMoney = (amount?: number): string => {
   if(amount == 0) return  "0";
  if(!amount) return  "";
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
