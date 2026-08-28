/** So khop ban dich cua nguoi hoc voi ban dich mau da luu, khong can goi AI. */
function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[.,!?;:"'`’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tra ve tung tu cua dap an kem co dung/sai, va diem 0..1 theo ti le tu dung dung vi tri. */
export function matchTranslation(answer, expected) {
  const got = normalize(answer).split(" ").filter(Boolean);
  const want = normalize(expected).split(" ").filter(Boolean);
  const words = want.map((w, i) => ({ word: w, ok: got[i] === w }));
  const hits = words.filter((w) => w.ok).length;
  // ponytail: so sanh theo vi tri, khong dung diff/LCS. Neu thieu 1 tu dau cau
  // thi diem se thap hon thuc te — doi sang LCS neu nguoi dung phan nan.
  return { words, exact: hits === want.length && got.length === want.length, score: want.length ? hits / want.length : 0 };
}
