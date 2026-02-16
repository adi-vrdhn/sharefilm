/**
 * Taste Match Session Service
 * Manages voting sessions and report generation between friends
 */

const { TasteMatchSession, TasteMatchReport, MovieTasteRating } = require("../models");
const tasteVectorService = require("./tasteVectorService");
const similarityService = require("./similarityService");

const VOTES_REQUIRED = 20;

/**
 * Get or create a taste match session between two users
 * Ensures consistent ordering: min(user_id) as user_id, max(user_id) as friend_id
 * @param {Number} userId - First user
 * @param {Number} friendId - Second user
 * @returns {Object} Session with normalized user IDs
 */
async function getOrCreateSession(userId, friendId) {
  try {
    // Normalize IDs: smaller is user_id, larger is friend_id
    const [normalizedUserId, normalizedFriendId] = userId < friendId 
      ? [userId, friendId] 
      : [friendId, userId];

    const [session, created] = await TasteMatchSession.findOrCreate({
      where: {
        user_id: normalizedUserId,
        friend_id: normalizedFriendId
      },
      defaults: {
        user_id: normalizedUserId,
        friend_id: normalizedFriendId,
        session_status: "voting_in_progress"
      }
    });

    return { session, created, normalizedUserId, normalizedFriendId };
  } catch (error) {
    console.error("Error getting/creating session:", error);
    throw error;
  }
}

/**
 * Track a vote and update session
 * @param {Number} votingUserId - User who just voted
 * @param {Number} friendId - Friend's ID
 * @returns {Object} Updated session with status
 */
async function trackVote(votingUserId, friendId) {
  try {
    const { session, normalizedUserId, normalizedFriendId } = 
      await getOrCreateSession(votingUserId, friendId);

    // Count current votes for voting user
    const votesCount = await MovieTasteRating.count({
      where: { user_id: votingUserId }
    });

    // Determine which user is voting
    const isUser = votingUserId === normalizedUserId;
    const fieldName = isUser ? "user_votes_count" : "friend_votes_count";
    const completedField = isUser ? "user_completed_at" : "friend_completed_at";

    const updates = {
      [fieldName]: votesCount
    };

    // If just hit 20 votes, mark as completed
    if (votesCount >= VOTES_REQUIRED && !session[completedField]) {
      updates[completedField] = new Date();
    }

    await session.update(updates);

    // Check if both users have completed
    const updatedSession = await TasteMatchSession.findByPk(session.id);

    if (updatedSession.user_completed_at && updatedSession.friend_completed_at) {
      // Both have voted - generate report
      await generateMatchReport(normalizedUserId, normalizedFriendId);
      await updatedSession.update({ session_status: "report_generated" });
    } else if (updatedSession.user_completed_at || updatedSession.friend_completed_at) {
      // Only one has voted
      await updatedSession.update({ session_status: "both_voted" });
    }

    return updatedSession;
  } catch (error) {
    console.error("Error tracking vote:", error);
    throw error;
  }
}

/**
 * Generate match report when both users have voted
 * @param {Number} userId - First user
 * @param {Number} friendId - Second user
 */
async function generateMatchReport(userId, friendId) {
  try {
    // Build taste vectors
    const result1 = await tasteVectorService.buildCompleteTasteVector(userId, MovieTasteRating);
    const result2 = await tasteVectorService.buildCompleteTasteVector(friendId, MovieTasteRating);

    // Calculate similarity
    const similarity = similarityService.cosineSimilarity(result1.vector, result2.vector);
    const matchPercentage = similarityService.similarityToPercentage(similarity);
    const genreCompatibility = similarityService.getGenreCompatibility(result1.vector, result2.vector);
    const summary = similarityService.generateSummary(matchPercentage, genreCompatibility);

    // Normalize order for report (min as user_id)
    const [reportUserId, reportFriendId] = userId < friendId 
      ? [userId, friendId] 
      : [friendId, userId];

    // Create or update report
    const [report] = await TasteMatchReport.findOrCreate({
      where: {
        user_id: reportUserId,
        friend_id: reportFriendId
      },
      defaults: {
        user_id: reportUserId,
        friend_id: reportFriendId,
        match_percentage: matchPercentage,
        similarity_score: parseFloat(similarity.toFixed(3)),
        genre_compatibility: genreCompatibility,
        summary,
        user_total_ratings: result1.totalRatedMovies,
        friend_total_ratings: result2.totalRatedMovies
      }
    });

    if (!report) {
      // Update if exists
      await TasteMatchReport.update(
        {
          match_percentage: matchPercentage,
          similarity_score: parseFloat(similarity.toFixed(3)),
          genre_compatibility: genreCompatibility,
          summary,
          user_total_ratings: result1.totalRatedMovies,
          friend_total_ratings: result2.totalRatedMovies
        },
        {
          where: {
            user_id: reportUserId,
            friend_id: reportFriendId
          }
        }
      );
    }

    return report;
  } catch (error) {
    console.error("Error generating match report:", error);
    throw error;
  }
}

/**
 * Get session state between two users
 * @param {Number} userId - First user (current user)
 * @param {Number} friendId - Second user (friend)
 * @returns {Object} Session status, report if available
 */
async function getSessionState(userId, friendId) {
  try {
    // Normalize IDs
    const [normalizedUserId, normalizedFriendId] = userId < friendId 
      ? [userId, friendId] 
      : [friendId, userId];

    // Check for existing session
    const session = await TasteMatchSession.findOne({
      where: {
        user_id: normalizedUserId,
        friend_id: normalizedFriendId
      }
    });

    if (!session) {
      return {
        status: "not_started",
        message: "No voting session started yet"
      };
    }

    // Check for report
    const report = await TasteMatchReport.findOne({
      where: {
        user_id: normalizedUserId,
        friend_id: normalizedFriendId
      }
    });

    if (report) {
      return {
        status: "report_ready",
        report: {
          match_percentage: report.match_percentage,
          similarity_score: report.similarity_score,
          genre_compatibility: report.genre_compatibility,
          summary: report.summary,
          user_total_ratings: report.user_total_ratings,
          friend_total_ratings: report.friend_total_ratings,
          created_at: report.created_at
        }
      };
    }

    // Determine which user is asking
    const isCurrentUserInitiator = userId === normalizedUserId;
    const currentUserVotes = isCurrentUserInitiator 
      ? session.user_votes_count 
      : session.friend_votes_count;
    const friendVotes = isCurrentUserInitiator 
      ? session.friend_votes_count 
      : session.user_votes_count;

    if (session.session_status === "voting_in_progress") {
      return {
        status: "voting_in_progress",
        votes_current_user: currentUserVotes,
        votes_friend: friendVotes,
        votes_required: VOTES_REQUIRED
      };
    }

    if (session.session_status === "both_voted") {
      return {
        status: "waiting_for_friend",
        your_votes: currentUserVotes,
        friend_votes: friendVotes,
        message: `${friendVotes >= VOTES_REQUIRED ? "Friend completed their votes! Report being generated..." : "Waiting for friend to complete their votes..."}`
      };
    }

    return {
      status: session.session_status,
      session
    };
  } catch (error) {
    console.error("Error getting session state:", error);
    throw error;
  }
}

module.exports = {
  getOrCreateSession,
  trackVote,
  generateMatchReport,
  getSessionState,
  VOTES_REQUIRED
};
