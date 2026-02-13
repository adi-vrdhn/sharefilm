const express = require("express");
const { SharedParty, Notification } = require("../models");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

// Create a shared party
router.post("/createSharedParty", async (req, res) => {
  try {
    const { movies, friendIds } = req.body;

    if (!movies || movies.length === 0) {
      return res.status(400).json({ message: "Movies required" });
    }

    const party = await SharedParty.create({
      id: uuidv4(),
      hostId: req.user.id,
      hostName: req.user.name,
      movies: movies,
      votes: {},
      active: true,
    });

    // Send notifications to friends with party ID
    if (friendIds && friendIds.length > 0) {
      for (const friendId of friendIds) {
        await Notification.create({
          userId: friendId,
          text: `${req.user.name} invited you to a Movie Party! Party ID: ${party.id}`,
          read: false,
        });
      }
    }

    return res.json({ partyId: party.id, party: party });
  } catch (error) {
    console.error("Error creating party:", error);
    return res.status(500).json({ message: "Failed to create party" });
  }
});

// Get party by ID
router.get("/getParty/:partyId", async (req, res) => {
  try {
    const party = await SharedParty.findByPk(req.params.partyId);

    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }

    return res.json(party);
  } catch (error) {
    console.error("Error fetching party:", error);
    return res.status(500).json({ message: "Failed to fetch party" });
  }
});

// Vote for a movie
router.post("/voteInParty", async (req, res) => {
  try {
    const { partyId, movieId } = req.body;

    if (!partyId || !movieId) {
      return res.status(400).json({ message: "Party ID and Movie ID required" });
    }

    const party = await SharedParty.findByPk(partyId);

    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }

    if (!party.active) {
      return res.status(400).json({ message: "Party is no longer active" });
    }

    // Update votes
    const currentVotes = party.votes || {};
    const userId = req.user.id.toString();

    // Check if user already voted
    const alreadyVoted = Object.values(currentVotes).some(
      (voters) => voters && voters.includes(userId)
    );

    if (alreadyVoted) {
      return res.status(400).json({ message: "You've already voted" });
    }

    // Add vote
    if (!currentVotes[movieId]) {
      currentVotes[movieId] = [];
    }
    currentVotes[movieId].push(userId);

    party.votes = currentVotes;
    await party.save();

    return res.json(party);
  } catch (error) {
    console.error("Error voting:", error);
    return res.status(500).json({ message: "Failed to vote" });
  }
});

// End party
router.post("/endParty/:partyId", async (req, res) => {
  try {
    const party = await SharedParty.findByPk(req.params.partyId);

    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }

    if (party.hostId !== req.user.id) {
      return res.status(403).json({ message: "Only host can end party" });
    }

    party.active = false;
    await party.save();

    return res.json({ message: "Party ended" });
  } catch (error) {
    console.error("Error ending party:", error);
    return res.status(500).json({ message: "Failed to end party" });
  }
});

module.exports = router;
