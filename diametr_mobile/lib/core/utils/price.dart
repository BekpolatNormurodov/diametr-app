/// The price a customer actually pays for one shop product (contract C1):
/// the shop's discount price when it is a real discount (> 0 and below the
/// regular price), otherwise the regular price. Same rule as the website and
/// the backend order lines. Returns null when the regular price is unknown.
num? effectivePrice(dynamic price, dynamic bonusPrice) {
  if (price is! num) return null;
  if (bonusPrice is num && bonusPrice > 0 && bonusPrice < price) {
    return bonusPrice;
  }
  return price;
}

/// Effective price of a shop-product row: the backend's `effective_price` when
/// present (C2/C3), otherwise computed from `price` / `bonus_price`.
num? rowEffectivePrice(Map row) {
  final eff = row['effective_price'];
  if (eff is num) return eff;
  return effectivePrice(row['price'], row['bonus_price']);
}
