export async function getRankings({ userId }, { userRepository }) {
  const top = await userRepository.listRankings(20);
  const myRank = await userRepository.getRank(userId);
  return { top, myRank };
}
