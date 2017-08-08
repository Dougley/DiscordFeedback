module.exports = {
  // Role ID :        { name, threshold, rank }
  // Rank is a number from 1 to  5 where 1 is the lowest ranked role
  // Deacy is the time in days to go from this role to custodian (lose a role every 7 days)
  '273571650287566848': {name: 'Custodians', threshold: 3, rank: 1, decay: 7, message: `As thanks for being so active in our community, we've decided to award you the coveted Custodian role! This gives you access to the channel <#284796966641205249> and you can use a few new bot commands. Please check out <#268812893087203338> for more info.`},
  '341246843558166529': {name: 'Record Keeper', threshold: 7, decay: 14, rank: 2},
  '341520994160082945': {name: 'Book Keeper', threshold: 14, decay: 21, rank: 3},
  '341521031246118913': {name: 'Librarian', threshold: 30, decay: 28, rank: 4},
  '341521085637853197': {name: 'Vizier', threshold: 60, decay: 35, rank: 5},
  '341521116675833866': {name: 'Grand Vizier', threshold: 120, decay: 42, rank: 6}
}