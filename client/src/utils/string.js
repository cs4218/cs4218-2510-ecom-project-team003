export const getShortDescription = (desc) => {
  if (!desc) {
    return "No description";
  }
  const s = String(desc);
  return s.length > 60 ? `${s.slice(0, 60)}...` : s;
};
