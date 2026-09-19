import axiosClient from "./axios.service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toList = (body: any): any[] => (Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : []);

/**
 * The logged-in owner's own stock rows.
 *
 * GET /shop-product/my (ADMIN) returns the caller shop's rows whose row, variant and product are
 * live, whatever the shop's own status — so a BLOCKED shop's owner still sees and manages the
 * stock. The public /shop-product/all hides a blocked shop's rows entirely.
 * A backend without /my answers 404 (the ':id' route): then fall back to the public list.
 * Callers still filter by shop_id (harmless when the server already scoped the list).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchOwnStock(): Promise<any[]> {
  try {
    const res = await axiosClient.get("/shop-product/my");
    return toList(res.data);
  } catch (e) {
    if ((e as { response?: { status?: number } })?.response?.status !== 404) throw e;
    const res = await axiosClient.get("/shop-product/all");
    return toList(res.data);
  }
}
