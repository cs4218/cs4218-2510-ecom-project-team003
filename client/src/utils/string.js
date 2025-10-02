export const getShortDescription = (desc) => {
  const s = desc == null ? "" : String(desc);
  return s.length > 60 ? `${s.slice(0, 60)}...` : s;
};
