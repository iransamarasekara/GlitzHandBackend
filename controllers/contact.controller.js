import contactModel from "../mongodb/models/contact.js";

// Contact form
export const createContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    const newContact = new contactModel({
      name,
      email,
      phone,
      message,
    });

    const savedContact = await newContact.save();
    res.status(201).json(savedContact);
  } catch (error) {
    res.status(400).json({
      message: "Error sending message",
      error: error.message,
    });
  }
};
