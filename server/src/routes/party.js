const express = require("express");
const router = express.Router();
const {
  Party,
  PartyMember,
  PartyMovie,
  PartyVote,
  User,
  Movie,
} = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create a new party with friends and movies
router.post("/createParty", async (req, res) => {
  try {
    const { invitedFriends, movies } = req.body;
    const userId = req.user.id;

    if (!invitedFriends || !movies || invitedFriends.length === 0 || movies.length === 0) {
      return res.status(400).json({ msg: "Friends and movies are required" });
    }

    // Create party
    const party = await Party.create({
      id: uuidv4(),
      createdBy: userId,
      active: true,
    });

    // Add creator as first member
    await PartyMember.create({
      id: uuidv4(),
      partyId: party.id,
      userId: userId,
    });

    // Add invited friends as members
    for (const friendId of invitedFriends) {
      await PartyMember.create({
        id: uuidv4(),
        partyId: party.id,
        userId: friendId,
      });
    }

    // Add movies to party
    for (const movieId of movies) {
      await PartyMovie.create({
        id: uuidv4(),
        partyId: party.id,
        movieId: movieId,
      });
    }

    // Fetch and return populated party
    const populatedParty = await getPartyWithDetails(party.id, userId);
    res.json(populatedParty);
  } catch (error) {
    console.error("Error creating party:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get all parties (active ones)
router.get("/getParties", async (req, res) => {
  try {
    const userId = req.user.id;

    const parties = await Party.findAll({
      where: { active: true },
      include: [
        {
          model: PartyMember,
          as: "members",
          attributes: ["userId"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "email"],
            },
          ],
        },
        {
          model: PartyMovie,
          as: "partyMovies",
          attributes: ["movieId"],
          include: [
            {
              model: Movie,
              as: "movie",
              attributes: ["id", "title", "poster", "year"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Format response with vote counts
    const formattedParties = [];
    for (const party of parties) {
      const votes = await PartyVote.findAll({
        where: { partyId: party.id },
        attributes: ["movieId"],
        raw: true,
      });

      const voteCount = {};
      votes.forEach((v) => {
        voteCount[v.movieId] = (voteCount[v.movieId] || 0) + 1;
      });

      formattedParties.push({
        id: party.id,
        createdBy: party.createdBy,
        creator: party.PartyMember?.[0]?.user?.name || "Unknown",
        members: party.PartyMembers || [],
        movies: party.PartyMovies?.map((pm) => pm.movie) || [],
        votes: voteCount,
      });
    }

    res.json(formattedParties);
  } catch (error) {
    console.error("Error fetching parties:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Join an existing party
router.post("/joinParty/:partyId", async (req, res) => {
  try {
    const { partyId } = req.params;
    const userId = req.user.id;

    // Check if party exists
    const party = await Party.findByPk(partyId);
    if (!party) {
      return res.status(404).json({ msg: "Party not found" });
    }

    // Check if user is already a member
    const existingMember = await PartyMember.findOne({
      where: { partyId, userId },
    });

    if (!existingMember) {
      await PartyMember.create({
        id: uuidv4(),
        partyId,
        userId,
      });
    }

    // Return populated party
    const populatedParty = await getPartyWithDetails(partyId, userId);
    res.json(populatedParty);
  } catch (error) {
    console.error("Error joining party:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Vote for a movie in party
router.post("/voteMovie", async (req, res) => {
  try {
    const { partyId, movieId } = req.body;
    const userId = req.user.id;

    if (!partyId || !movieId) {
      return res.status(400).json({ msg: "Party ID and Movie ID required" });
    }

    // Check if user is member of party
    const member = await PartyMember.findOne({
      where: { partyId, userId },
    });

    if (!member) {
      return res.status(403).json({ msg: "Not a member of this party" });
    }

    // Check if movie is in party
    const partyMovie = await PartyMovie.findOne({
      where: { partyId, movieId },
    });

    if (!partyMovie) {
      return res.status(404).json({ msg: "Movie not in this party" });
    }

    // Check if user already voted for this movie
    const existingVote = await PartyVote.findOne({
      where: { partyId, userId, movieId },
    });

    if (existingVote) {
      return res.status(400).json({ msg: "You already voted for this movie" });
    }

    // Create vote
    const vote = await PartyVote.create({
      id: uuidv4(),
      partyId,
      userId,
      movieId,
    });

    res.json(vote);
  } catch (error) {
    console.error("Error voting:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Leave a party
router.post("/leaveParty/:partyId", async (req, res) => {
  try {
    const { partyId } = req.params;
    const userId = req.user.id;

    // Remove user from party members
    await PartyMember.destroy({
      where: { partyId, userId },
    });

    // Check if any members left
    const remainingMembers = await PartyMember.findAll({
      where: { partyId },
    });

    // If no members left, deactivate party
    if (remainingMembers.length === 0) {
      await Party.update({ active: false }, { where: { id: partyId } });
    }

    res.json({ msg: "Left party" });
  } catch (error) {
    console.error("Error leaving party:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Helper function to get party with full details
async function getPartyWithDetails(partyId, userId) {
  const party = await Party.findByPk(partyId, {
    include: [
      {
        model: PartyMember,
        as: "members",
        attributes: ["userId"],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email"],
          },
        ],
      },
      {
        model: PartyMovie,
        as: "partyMovies",
        attributes: ["movieId"],
        include: [
          {
            model: Movie,
            as: "movie",
            attributes: ["id", "title", "poster", "year"],
          },
        ],
      },
    ],
  });

  if (!party) return null;

  // Get vote counts for each movie
  const votes = await PartyVote.findAll({
    where: { partyId },
    attributes: ["movieId"],
    raw: true,
  });

  const voteCount = {};
  votes.forEach((v) => {
    voteCount[v.movieId] = (voteCount[v.movieId] || 0) + 1;
  });

  return {
    id: party.id,
    createdBy: party.createdBy,
    active: party.active,
    creator: party.PartyMembers?.[0]?.user?.name || "Unknown",
    members: party.PartyMembers || [],
    movies: party.PartyMovies?.map((pm) => pm.movie) || [],
    votes: voteCount,
  };
}

module.exports = router;
