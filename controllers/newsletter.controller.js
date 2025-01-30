import newsLetterModel from "../mongodb/models/newsletter.js";

// Subscribe to newsletter
export const subscribeToNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    const emailExists = await newsLetterModel
      .findOne({ email })
      .select("_id email");

    if (emailExists) {
      return res.status(400).json({ message: "Email already subscribed" });
    }

    const newSubscriber = new newsLetterModel({
      email,
    });

    const savedSubscriber = await newSubscriber.save();
    res.status(201).json(savedSubscriber);
  } catch (error) {
    res
      .status(400)
      .json({
        message: "Error subscribing to newsletter",
        error: error.message,
      });
  }
};
