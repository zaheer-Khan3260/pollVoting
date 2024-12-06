import  Poll  from '../models/poll.models.js';
import PollOption from "../models/pollOption.models.js";
import  sequelize  from "../config/database.js"

// Get global leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    // Get top 10 poll options across all polls
    const topOptions = await PollOption.findAll({
      attributes: [
        'id',
        'text',
        [sequelize.fn('SUM', sequelize.col('voteCount')), 'totalVotes'],
      ],
      include: [
        {
          model: Poll,
          as: 'poll',
          where: { isActive: true },
        },
      ],
      group: ['PollOption.id', 'poll.id'],
      order: [[sequelize.fn('SUM', sequelize.col('voteCount')), 'DESC']],
      limit: 10,
    });

    // Transform data for the response
    const leaderboard = topOptions.map((option) => ({
      id: option.id,
      text: option.text,
      totalVotes: option.get('totalVotes'),
      pollTitle: option.poll.title,
    }));

    res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error); 
    res.status(500).json({ error: error.message });
  }
};
